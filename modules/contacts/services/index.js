class ContactService {
  constructor() {
    this.contacts = [];
    this.groups = [];
    this.tags = [];
  }

  // Contact CRUD operations
  async createContact(contactData) {
    const contact = {
      id: Date.now().toString(),
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    
    this.contacts.push(contact);
    return contact;
  }

  async getContacts(filters = {}) {
    let filteredContacts = [...this.contacts];
    
    if (filters.status) {
      filteredContacts = filteredContacts.filter(contact => contact.status === filters.status);
    }
    
    if (filters.groupId) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.groups && contact.groups.includes(filters.groupId)
      );
    }
    
    if (filters.tag) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.tags && contact.tags.includes(filters.tag)
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact =>
        contact.firstName?.toLowerCase().includes(searchTerm) ||
        contact.lastName?.toLowerCase().includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm) ||
        contact.phone?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredContacts;
  }

  async getContactById(id) {
    return this.contacts.find(contact => contact.id === id);
  }

  async updateContact(id, updates) {
    const contactIndex = this.contacts.findIndex(contact => contact.id === id);
    if (contactIndex === -1) return null;
    
    this.contacts[contactIndex] = {
      ...this.contacts[contactIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.contacts[contactIndex];
  }

  async deleteContact(id) {
    const contactIndex = this.contacts.findIndex(contact => contact.id === id);
    if (contactIndex === -1) return false;
    
    this.contacts.splice(contactIndex, 1);
    return true;
  }

  // Bulk operations
  async bulkUpdateContacts(contactIds, updates) {
    const updatedContacts = [];
    
    for (const id of contactIds) {
      const updated = await this.updateContact(id, updates);
      if (updated) {
        updatedContacts.push(updated);
      }
    }
    
    return updatedContacts;
  }

  async bulkDeleteContacts(contactIds) {
    let deletedCount = 0;
    
    for (const id of contactIds) {
      const deleted = await this.deleteContact(id);
      if (deleted) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Contact groups
  async createGroup(groupData) {
    const group = {
      id: Date.now().toString(),
      ...groupData,
      contactCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.groups.push(group);
    return group;
  }

  async getGroups() {
    return this.groups;
  }

  async getGroupById(id) {
    return this.groups.find(group => group.id === id);
  }

  async updateGroup(id, updates) {
    const groupIndex = this.groups.findIndex(group => group.id === id);
    if (groupIndex === -1) return null;
    
    this.groups[groupIndex] = {
      ...this.groups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.groups[groupIndex];
  }

  async deleteGroup(id) {
    const groupIndex = this.groups.findIndex(group => group.id === id);
    if (groupIndex === -1) return false;
    
    // Remove group from all contacts
    for (const contact of this.contacts) {
      if (contact.groups && contact.groups.includes(id)) {
        contact.groups = contact.groups.filter(g => g !== id);
        contact.updatedAt = new Date().toISOString();
      }
    }
    
    this.groups.splice(groupIndex, 1);
    return true;
  }

  // Contact tags
  async createTag(tagData) {
    const tag = {
      id: Date.now().toString(),
      ...tagData,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    
    this.tags.push(tag);
    return tag;
  }

  async getTags() {
    return this.tags;
  }

  async getTagById(id) {
    return this.tags.find(tag => tag.id === id);
  }

  async updateTag(id, updates) {
    const tagIndex = this.tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) return null;
    
    this.tags[tagIndex] = {
      ...this.tags[tagIndex],
      ...updates
    };
    
    return this.tags[tagIndex];
  }

  async deleteTag(id) {
    const tagIndex = this.tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) return false;
    
    // Remove tag from all contacts
    for (const contact of this.contacts) {
      if (contact.tags && contact.tags.includes(id)) {
        contact.tags = contact.tags.filter(t => t !== id);
        contact.updatedAt = new Date().toISOString();
      }
    }
    
    this.tags.splice(tagIndex, 1);
    return true;
  }

  // Contact import/export
  async importContacts(contactsData, options = {}) {
    const importedContacts = [];
    const errors = [];
    
    for (const contactData of contactsData) {
      try {
        const contact = await this.createContact(contactData);
        importedContacts.push(contact);
      } catch (error) {
        errors.push({
          contact: contactData,
          error: error.message
        });
      }
    }
    
    return {
      imported: importedContacts.length,
      errors: errors.length,
      details: {
        imported: importedContacts,
        errors
      }
    };
  }

  async exportContacts(format = 'json', filters = {}) {
    const contacts = await this.getContacts(filters);
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.convertToCSV(contacts);
      case 'json':
        return JSON.stringify(contacts, null, 2);
      case 'xml':
        return this.convertToXML(contacts);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Contact statistics
  async getContactStats() {
    const totalContacts = this.contacts.length;
    const activeContacts = this.contacts.filter(c => c.status === 'active').length;
    const inactiveContacts = this.contacts.filter(c => c.status === 'inactive').length;
    
    return {
      total: totalContacts,
      active: activeContacts,
      inactive: inactiveContacts,
      groups: this.groups.length,
      tags: this.tags.length,
      recentActivity: this.contacts
        .filter(c => {
          const daysSinceUpdate = (new Date() - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate <= 7;
        })
        .length
    };
  }

  // Contact search
  async searchContacts(query, filters = {}) {
    const searchTerm = query.toLowerCase();
    let results = this.contacts.filter(contact =>
      contact.firstName?.toLowerCase().includes(searchTerm) ||
      contact.lastName?.toLowerCase().includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm) ||
      contact.phone?.toLowerCase().includes(searchTerm) ||
      contact.company?.toLowerCase().includes(searchTerm)
    );
    
    // Apply additional filters
    if (filters.status) {
      results = results.filter(contact => contact.status === filters.status);
    }
    
    if (filters.groupId) {
      results = results.filter(contact => 
        contact.groups && contact.groups.includes(filters.groupId)
      );
    }
    
    return results;
  }

  // Contact validation
  validateContact(contactData) {
    const errors = [];
    
    if (!contactData.firstName && !contactData.lastName) {
      errors.push('First name or last name is required');
    }
    
    if (contactData.email && !this.isValidEmail(contactData.email)) {
      errors.push('Invalid email format');
    }
    
    if (contactData.phone && !this.isValidPhone(contactData.phone)) {
      errors.push('Invalid phone number format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  convertToXML(data) {
    if (!data.length) return '<contacts></contacts>';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<contacts>\n';
    
    for (const item of data) {
      xml += '  <contact>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += '  </contact>\n';
    }
    
    xml += '</contacts>';
    return xml;
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      module: 'contacts',
      timestamp: new Date().toISOString(),
      services: {
        contacts: this.contacts.length,
        groups: this.groups.length,
        tags: this.tags.length
      }
    };
  }
}

module.exports = new ContactService();
