const express = require('express');
const router = express.Router();

// Import centralized auth middleware
const { requireAuth } = require('../../../middleware/authMiddleware');

// Middleware to check if user is super_admin only
const requireSuperAdmin = requireAuth({ 
  roles: ['super_admin'],
  permissions: ['manage_organizations']
});

/**
 * GET /api/modules/organizations
 * Get all organizations (super admin only)
 */
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    // Mock data for now - will be replaced with database queries
    const organizations = [
      {
        id: '1',
        name: 'Acme Corp',
        domain: 'acme.com',
        plan: 'enterprise',
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        userCount: 150,
        adminCount: 5,
        settings: {
          maxUsers: 1000,
          features: ['analytics', 'api', 'integrations']
        }
      },
      {
        id: '2',
        name: 'TechStart Inc',
        domain: 'techstart.io',
        plan: 'pro',
        status: 'active',
        createdAt: '2024-02-20T00:00:00Z',
        userCount: 25,
        adminCount: 2,
        settings: {
          maxUsers: 100,
          features: ['analytics', 'api']
        }
      },
      {
        id: '3',
        name: 'Demo Company',
        domain: 'demo.com',
        plan: 'free',
        status: 'pending',
        createdAt: '2024-03-10T00:00:00Z',
        userCount: 3,
        adminCount: 1,
        settings: {
          maxUsers: 10,
          features: ['basic']
        }
      }
    ];

    res.json({
      success: true,
      data: {
        organizations,
        total: organizations.length
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch organizations"
    });
  }
});

/**
 * GET /api/modules/organizations/:id
 * Get specific organization (super admin only)
 */
router.get("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data - in production this would query the database
    const organization = {
      id,
      name: 'Acme Corp',
      domain: 'acme.com',
      plan: 'enterprise',
      status: 'active',
      createdAt: '2024-01-15T00:00:00Z',
      userCount: 150,
      adminCount: 5,
      settings: {
        maxUsers: 1000,
        features: ['analytics', 'api', 'integrations']
      },
      billing: {
        currentPeriodStart: '2024-01-01',
        currentPeriodEnd: '2024-01-31',
        amount: 299.00,
        currency: 'USD'
      }
    };

    res.json({
      success: true,
      data: { organization }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch organization"
    });
  }
});

/**
 * POST /api/modules/organizations
 * Create new organization (super admin only)
 */
router.post("/", requireSuperAdmin, async (req, res) => {
  try {
    const { name, domain, plan, maxUsers } = req.body;
    
    if (!name || !domain || !plan) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, and plan are required"
      });
    }

    // Mock organization creation
    const newOrganization = {
      id: Date.now().toString(),
      name,
      domain,
      plan,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userCount: 0,
      adminCount: 0,
      settings: {
        maxUsers: maxUsers || 10,
        features: plan === 'enterprise' ? ['analytics', 'api', 'integrations'] : 
                  plan === 'pro' ? ['analytics', 'api'] : ['basic']
      }
    };

    res.status(201).json({
      success: true,
      data: { organization: newOrganization },
      message: "Organization created successfully"
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create organization"
    });
  }
});

/**
 * PUT /api/modules/organizations/:id
 * Update organization (super admin only)
 */
router.put("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, plan, status, maxUsers } = req.body;
    
    // Mock organization update
    const updatedOrganization = {
      id,
      name: name || 'Acme Corp',
      domain: domain || 'acme.com',
      plan: plan || 'enterprise',
      status: status || 'active',
      updatedAt: new Date().toISOString(),
      settings: {
        maxUsers: maxUsers || 1000,
        features: plan === 'enterprise' ? ['analytics', 'api', 'integrations'] : 
                  plan === 'pro' ? ['analytics', 'api'] : ['basic']
      }
    };

    res.json({
      success: true,
      data: { organization: updatedOrganization },
      message: "Organization updated successfully"
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update organization"
    });
  }
});

/**
 * DELETE /api/modules/organizations/:id
 * Delete organization (super admin only)
 */
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock organization deletion
    res.json({
      success: true,
      message: `Organization ${id} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete organization"
    });
  }
});

module.exports = router;



