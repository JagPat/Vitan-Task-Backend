class TemplateService {
  constructor() {
    this.taskTemplates = [];
    this.projectTemplates = [];
  }

  // Task Template CRUD operations
  async createTaskTemplate(templateData) {
    const template = {
      id: Date.now().toString(),
      type: 'task',
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.taskTemplates.push(template);
    return template;
  }

  async getTaskTemplates(filters = {}) {
    let filteredTemplates = [...this.taskTemplates];
    
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === filters.category);
    }
    
    if (filters.priority) {
      filteredTemplates = filteredTemplates.filter(template => template.priority === filters.priority);
    }
    
    return filteredTemplates;
  }

  async getTaskTemplateById(id) {
    return this.taskTemplates.find(template => template.id === id);
  }

  async updateTaskTemplate(id, updates) {
    const templateIndex = this.taskTemplates.findIndex(template => template.id === id);
    if (templateIndex === -1) return null;
    
    this.taskTemplates[templateIndex] = {
      ...this.taskTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.taskTemplates[templateIndex];
  }

  async deleteTaskTemplate(id) {
    const templateIndex = this.taskTemplates.findIndex(template => template.id === id);
    if (templateIndex === -1) return false;
    
    this.taskTemplates.splice(templateIndex, 1);
    return true;
  }

  // Project Template CRUD operations
  async createProjectTemplate(templateData) {
    const template = {
      id: Date.now().toString(),
      type: 'project',
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projectTemplates.push(template);
    return template;
  }

  async getProjectTemplates(filters = {}) {
    let filteredTemplates = [...this.projectTemplates];
    
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === filters.category);
    }
    
    if (filters.complexity) {
      filteredTemplates = filteredTemplates.filter(template => template.complexity === filters.complexity);
    }
    
    return filteredTemplates;
  }

  async getProjectTemplateById(id) {
    return this.projectTemplates.find(template => template.id === id);
  }

  async updateProjectTemplate(id, updates) {
    const templateIndex = this.projectTemplates.findIndex(template => template.id === id);
    if (templateIndex === -1) return null;
    
    this.projectTemplates[templateIndex] = {
      ...this.projectTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.projectTemplates[templateIndex];
  }

  async deleteProjectTemplate(id) {
    const templateIndex = this.projectTemplates.findIndex(template => template.id === id);
    if (templateIndex === -1) return false;
    
    this.projectTemplates.splice(templateIndex, 1);
    return true;
  }

  // Template cloning
  async cloneTaskTemplate(id, customizations = {}) {
    const original = await this.getTaskTemplateById(id);
    if (!original) return null;
    
    const cloned = {
      ...original,
      id: Date.now().toString(),
      name: `${original.name} (Copy)`,
      ...customizations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    delete cloned.id; // Remove the original ID
    this.taskTemplates.push(cloned);
    return cloned;
  }

  async cloneProjectTemplate(id, customizations = {}) {
    const original = await this.getProjectTemplateById(id);
    if (!original) return null;
    
    const cloned = {
      ...original,
      id: Date.now().toString(),
      name: `${original.name} (Copy)`,
      ...customizations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    delete cloned.id; // Remove the original ID
    this.projectTemplates.push(cloned);
    return cloned;
  }

  // Template usage tracking
  async trackTemplateUsage(templateId, usageData) {
    // This would typically update a database record
    // For now, we'll just return success
    return {
      templateId,
      usage: usageData,
      trackedAt: new Date().toISOString()
    };
  }

  // Template statistics
  async getTemplateStats() {
    return {
      totalTemplates: this.taskTemplates.length + this.projectTemplates.length,
      taskTemplates: this.taskTemplates.length,
      projectTemplates: this.projectTemplates.length,
      categories: {
        task: [...new Set(this.taskTemplates.map(t => t.category))],
        project: [...new Set(this.projectTemplates.map(t => t.category))]
      }
    };
  }

  // Template search
  async searchTemplates(query, type = 'all') {
    const searchTerm = query.toLowerCase();
    let results = [];
    
    if (type === 'all' || type === 'task') {
      const taskResults = this.taskTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.category?.toLowerCase().includes(searchTerm)
      );
      results.push(...taskResults);
    }
    
    if (type === 'all' || type === 'project') {
      const projectResults = this.projectTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.category?.toLowerCase().includes(searchTerm)
      );
      results.push(...projectResults);
    }
    
    return results;
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      module: 'templates',
      timestamp: new Date().toISOString(),
      services: {
        taskTemplates: this.taskTemplates.length,
        projectTemplates: this.projectTemplates.length
      }
    };
  }
}

module.exports = new TemplateService();
