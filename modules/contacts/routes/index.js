const express = require('express');
const contactService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await contactService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Contact service health check failed' });
  }
});

// Contact CRUD operations
router.post('/', async (req, res) => {
  try {
    const validation = contactService.validateContact(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Contact validation failed', 
        details: validation.errors 
      });
    }
    
    const contact = await contactService.createContact(req.body);
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create contact' });
  }
});

router.get('/', async (req, res) => {
  try {
    const contacts = await contactService.getContacts(req.query);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await contactService.deleteContact(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Bulk operations
router.post('/bulk/update', async (req, res) => {
  try {
    const { contactIds, updates } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates object is required' });
    }
    
    const updatedContacts = await contactService.bulkUpdateContacts(contactIds, updates);
    res.json({
      message: `${updatedContacts.length} contacts updated successfully`,
      updated: updatedContacts
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to bulk update contacts' });
  }
});

router.post('/bulk/delete', async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }
    
    const deletedCount = await contactService.bulkDeleteContacts(contactIds);
    res.json({
      message: `${deletedCount} contacts deleted successfully`,
      deleted: deletedCount
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to bulk delete contacts' });
  }
});

// Contact groups
router.post('/groups', async (req, res) => {
  try {
    const group = await contactService.createGroup(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create group' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = await contactService.getGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/groups/:id', async (req, res) => {
  try {
    const group = await contactService.getGroupById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

router.put('/groups/:id', async (req, res) => {
  try {
    const group = await contactService.updateGroup(req.params.id, req.body);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update group' });
  }
});

router.delete('/groups/:id', async (req, res) => {
  try {
    const deleted = await contactService.deleteGroup(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Contact tags
router.post('/tags', async (req, res) => {
  try {
    const tag = await contactService.createTag(req.body);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create tag' });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const tags = await contactService.getTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/tags/:id', async (req, res) => {
  try {
    const tag = await contactService.getTagById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.put('/tags/:id', async (req, res) => {
  try {
    const tag = await contactService.updateTag(req.params.id, req.body);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(tag);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', async (req, res) => {
  try {
    const deleted = await contactService.deleteTag(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Contact import/export
router.post('/import', async (req, res) => {
  try {
    const { contacts, options } = req.body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts array is required' });
    }
    
    const result = await contactService.importContacts(contacts, options);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Failed to import contacts' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const { format, ...filters } = req.query;
    
    if (!format) {
      return res.status(400).json({ error: 'Export format is required' });
    }
    
    const data = await contactService.exportContacts(format, filters);
    
    res.setHeader('Content-Type', this.getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="contacts-export.${format}"`);
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to export contacts: ${error.message}` });
  }
});

// Contact statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await contactService.getContactStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact statistics' });
  }
});

// Contact search
router.get('/search', async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await contactService.searchContacts(query, filters);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

// Utility method for content type
function getContentType(format) {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
  };
  
  return contentTypes[format.toLowerCase()] || 'application/octet-stream';
}

module.exports = router;
