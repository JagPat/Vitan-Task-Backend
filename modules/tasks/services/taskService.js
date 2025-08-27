/**
 * Task Service - Migrated to Modular Architecture (Phase-2)
 * 
 * This service has been migrated from the existing services/taskService.js
 * and updated to use the shared database connection and event bus.
 * 
 * Changes made:
 * - Removed individual pg.Pool creation (now uses shared database connection)
 * - Integrated with event bus for inter-module communication
 * - Maintained all existing functionality for backward compatibility
 */

const winston = require('winston');

class TaskService {
  constructor(database, eventBus) {
    this.database = database;
    this.eventBus = eventBus;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'task-service.log' })
      ]
    });
  }

  // Create a new task
  async createTask(taskData) {
    const client = await this.database.getClient();
    
    try {
      const {
        title,
        description,
        due_date,
        priority = 'medium',
        assigned_to_whatsapp,
        created_by_whatsapp,
        tags = [],
        estimated_hours = null,
        project_id = null,
        watchers = []
      } = taskData;

      // Get user ID from WhatsApp number
      let assignedToId = null;
      let createdById = null;

      if (assigned_to_whatsapp) {
        const assignedUser = await this.getUserByWhatsApp(assigned_to_whatsapp);
        assignedToId = assignedUser?.id;
      }

      if (created_by_whatsapp) {
        const createdUser = await this.getUserByWhatsApp(created_by_whatsapp);
        createdById = createdUser?.id;
      }

      const query = `
        INSERT INTO tasks (
          title, description, due_date, priority,
          assigned_to, assigned_to_whatsapp, created_by, created_by_whatsapp,
          tags, estimated_hours, status, project_id, watchers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        title,
        description,
        due_date,
        priority,
        assignedToId,
        assigned_to_whatsapp,
        createdById,
        created_by_whatsapp,
        JSON.stringify(tags),
        estimated_hours,
        'pending',
        project_id,
        JSON.stringify(watchers || [])
      ];

      const result = await client.query(query, values);
      const task = result.rows[0];

      this.logger.info('Task created successfully', {
        taskId: task.id,
        title: task.title,
        assignedTo: assigned_to_whatsapp
      });

      // Emit task creation event
      await this.eventBus.emit('task:created', {
        id: task.id,
        title: task.title,
        assignedTo: assigned_to_whatsapp,
        createdBy: created_by_whatsapp,
        projectId: project_id
      });

      return task;

    } catch (error) {
      this.logger.error('Error creating task', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all tasks with optional filters
  async getAllTasks(filters = {}) {
    const client = await this.database.getClient();
    
    try {
      let query = 'SELECT * FROM tasks WHERE deleted_at IS NULL';
      const values = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        values.push(filters.priority);
      }

      if (filters.assigned_to) {
        paramCount++;
        query += ` AND assigned_to_whatsapp = $${paramCount}`;
        values.push(filters.assigned_to);
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, values);
      
      this.logger.info('Tasks retrieved', { count: result.rows.length, filters });
      return result.rows;

    } catch (error) {
      // Graceful fallback if the tasks table is not created yet (PostgreSQL code 42P01)
      if (error.code === '42P01' || /relation\s+"?tasks"?\s+does not exist/i.test(error.message)) {
        this.logger.warn('Tasks table not found, returning empty list for compatibility');
        return [];
      }
      this.logger.error('Error getting tasks', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Get task by ID
  async getTaskById(taskId) {
    const client = await this.database.getClient();
    
    try {
      const query = 'SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [taskId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      this.logger.info('Task retrieved by ID', { taskId });
      return result.rows[0];

    } catch (error) {
      this.logger.error('Error getting task by ID', { taskId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Update task
  async updateTask(taskId, updates) {
    const client = await this.database.getClient();
    
    try {
      const allowedFields = [
        'title', 'description', 'due_date', 'priority', 'status',
        'assigned_to', 'assigned_to_whatsapp', 'tags', 'estimated_hours'
      ];

      const updateFields = [];
      const values = [];
      let paramCount = 0;

      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      values.push(taskId);

      const query = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = result.rows[0];

      this.logger.info('Task updated', { taskId, updatedFields: Object.keys(updates) });

      // Emit task update event
      await this.eventBus.emit('task:updated', {
        id: taskId,
        updates,
        task
      });

      return task;

    } catch (error) {
      this.logger.error('Error updating task', { taskId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete task (soft delete)
  async deleteTask(taskId) {
    const client = await this.database.getClient();
    
    try {
      const query = `
        UPDATE tasks 
        SET deleted_at = NOW(), status = 'deleted'
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [taskId]);
      
      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      this.logger.info('Task deleted', { taskId });

      // Emit task deletion event
      await this.eventBus.emit('task:deleted', {
        id: taskId,
        deletedAt: new Date()
      });

      return result.rows[0];

    } catch (error) {
      this.logger.error('Error deleting task', { taskId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user by WhatsApp number
  async getUserByWhatsApp(whatsappNumber) {
    const client = await this.database.getClient();
    
    try {
      const query = 'SELECT id, name, whatsapp_number FROM users WHERE whatsapp_number = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [whatsappNumber]);
      
      return result.rows[0] || null;

    } catch (error) {
      this.logger.error('Error getting user by WhatsApp', { whatsappNumber, error: error.message });
      return null;
    } finally {
      client.release();
    }
  }

  // Health check for the task service
  async healthCheck() {
    try {
      // Test database connection
      const client = await this.database.getClient();
      await client.query('SELECT 1');
      client.release();

      return {
        status: 'healthy',
        service: 'TaskService',
        timestamp: new Date().toISOString(),
        database: 'connected',
        eventBusRouter: 'available'
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'TaskService',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = TaskService;
