class DashboardService {
  constructor() {
    this.metrics = {
      tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
      projects: { total: 0, active: 0, completed: 0, onHold: 0 },
      users: { total: 0, active: 0, inactive: 0 },
      teams: { total: 0, active: 0 }
    };
    this.activities = [];
    this.charts = {};
  }

  // Dashboard overview
  async getDashboardOverview() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recentActivity: this.activities.slice(-10),
      quickStats: {
        completionRate: this.metrics.tasks.total > 0 
          ? Math.round((this.metrics.tasks.completed / this.metrics.tasks.total) * 100)
          : 0,
        activeProjects: this.metrics.projects.active,
        teamCollaboration: this.metrics.teams.active
      }
    };
  }

  // Key metrics
  async getKeyMetrics() {
    return {
      tasks: {
        total: this.metrics.tasks.total,
        completed: this.metrics.tasks.completed,
        pending: this.metrics.tasks.pending,
        overdue: this.metrics.tasks.overdue,
        completionRate: this.metrics.tasks.total > 0 
          ? Math.round((this.metrics.tasks.completed / this.metrics.tasks.total) * 100)
          : 0
      },
      projects: {
        total: this.metrics.projects.total,
        active: this.metrics.projects.active,
        completed: this.metrics.projects.completed,
        onHold: this.metrics.projects.onHold,
        successRate: this.metrics.projects.total > 0
          ? Math.round((this.metrics.projects.completed / this.metrics.projects.total) * 100)
          : 0
      },
      users: {
        total: this.metrics.users.total,
        active: this.metrics.users.active,
        inactive: this.metrics.users.inactive,
        engagementRate: this.metrics.users.total > 0
          ? Math.round((this.metrics.users.active / this.metrics.users.total) * 100)
          : 0
      },
      teams: {
        total: this.metrics.teams.total,
        active: this.metrics.teams.active,
        collaborationRate: this.metrics.teams.total > 0
          ? Math.round((this.metrics.teams.active / this.metrics.teams.total) * 100)
          : 0
      }
    };
  }

  // Recent activity
  async getRecentActivity(limit = 20) {
    return this.activities
      .slice(-limit)
      .reverse()
      .map(activity => ({
        ...activity,
        timeAgo: this.getTimeAgo(activity.timestamp)
      }));
  }

  // Activity tracking
  async logActivity(type, description, userId, metadata = {}) {
    const activity = {
      id: Date.now().toString(),
      type,
      description,
      userId,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.activities.push(activity);
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(-1000);
    }
    
    return activity;
  }

  // Chart data
  async getChartData(chartType, filters = {}) {
    switch (chartType) {
      case 'taskProgress':
        return this.getTaskProgressChart(filters);
      case 'projectTimeline':
        return this.getProjectTimelineChart(filters);
      case 'userActivity':
        return this.getUserActivityChart(filters);
      case 'teamPerformance':
        return this.getTeamPerformanceChart(filters);
      default:
        return { error: 'Unknown chart type' };
    }
  }

  // Task progress chart
  async getTaskProgressChart(filters = {}) {
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return {
      labels: last30Days,
      datasets: [
        {
          label: 'Completed Tasks',
          data: last30Days.map(() => Math.floor(Math.random() * 20) + 5),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          label: 'New Tasks',
          data: last30Days.map(() => Math.floor(Math.random() * 15) + 3),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }
      ]
    };
  }

  // Project timeline chart
  async getProjectTimelineChart(filters = {}) {
    return {
      labels: ['Planning', 'Development', 'Testing', 'Deployment', 'Completed'],
      datasets: [
        {
          label: 'Projects',
          data: [5, 8, 6, 4, 12],
          backgroundColor: [
            '#F59E0B',
            '#3B82F6',
            '#8B5CF6',
            '#EF4444',
            '#10B981'
          ]
        }
      ]
    };
  }

  // User activity chart
  async getUserActivityChart(filters = {}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        {
          label: 'Active Users',
          data: hours.map(() => Math.floor(Math.random() * 50) + 10),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true
        }
      ]
    };
  }

  // Team performance chart
  async getTeamPerformanceChart(filters = {}) {
    return {
      labels: ['Team A', 'Team B', 'Team C', 'Team D'],
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: [85, 92, 78, 88],
          backgroundColor: [
            '#10B981',
            '#3B82F6',
            '#F59E0B',
            '#8B5CF6'
          ]
        }
      ]
    };
  }

  // Performance insights
  async getPerformanceInsights() {
    const taskCompletionRate = this.metrics.tasks.total > 0 
      ? (this.metrics.tasks.completed / this.metrics.tasks.total) * 100
      : 0;
    
    const projectSuccessRate = this.metrics.projects.total > 0
      ? (this.metrics.projects.completed / this.metrics.projects.total) * 100
      : 0;

    return {
      insights: [
        {
          type: 'positive',
          title: 'Task Completion',
          message: `Task completion rate is ${taskCompletionRate.toFixed(1)}%`,
          value: taskCompletionRate,
          trend: 'up'
        },
        {
          type: 'positive',
          title: 'Project Success',
          message: `Project success rate is ${projectSuccessRate.toFixed(1)}%`,
          value: projectSuccessRate,
          trend: 'up'
        },
        {
          type: 'info',
          title: 'Team Collaboration',
          message: `${this.metrics.teams.active} active teams`,
          value: this.metrics.teams.active,
          trend: 'stable'
        }
      ],
      recommendations: [
        'Focus on completing overdue tasks to improve completion rate',
        'Consider team collaboration tools for better project coordination',
        'Monitor project timelines to prevent delays'
      ]
    };
  }

  // Update metrics (called by other services)
  async updateMetrics(metricType, data) {
    if (this.metrics[metricType]) {
      this.metrics[metricType] = { ...this.metrics[metricType], ...data };
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      module: 'dashboard',
      timestamp: new Date().toISOString(),
      services: {
        metrics: Object.keys(this.metrics).length,
        activities: this.activities.length,
        charts: Object.keys(this.charts).length
      }
    };
  }

  // Utility method for time ago
  getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

module.exports = new DashboardService();
