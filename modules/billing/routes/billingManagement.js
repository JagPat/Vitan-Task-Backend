const express = require('express');
const router = express.Router();

// Import centralized auth middleware
const { requireAuth } = require('../../../middleware/authMiddleware');

// Middleware to check if user is super_admin only
const requireSuperAdmin = requireAuth({ 
  roles: ['super_admin'],
  permissions: ['manage_billing']
});

/**
 * GET /api/modules/billing
 * Get all billing information (super admin only)
 */
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    // Mock billing data
    const billingData = [
      {
        id: '1',
        organizationId: '1',
        organizationName: 'Acme Corp',
        plan: 'enterprise',
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-01-31T23:59:59Z',
        amount: 299.00,
        currency: 'USD',
        nextBillingDate: '2024-02-01T00:00:00Z',
        paymentMethod: 'credit_card',
        lastPayment: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        organizationId: '2',
        organizationName: 'TechStart Inc',
        plan: 'pro',
        status: 'active',
        currentPeriodStart: '2024-02-01T00:00:00Z',
        currentPeriodEnd: '2024-02-29T23:59:59Z',
        amount: 99.00,
        currency: 'USD',
        nextBillingDate: '2024-03-01T00:00:00Z',
        paymentMethod: 'credit_card',
        lastPayment: '2024-02-01T00:00:00Z'
      },
      {
        id: '3',
        organizationId: '3',
        organizationName: 'Demo Company',
        plan: 'free',
        status: 'active',
        currentPeriodStart: '2024-03-01T00:00:00Z',
        currentPeriodEnd: '2024-03-31T23:59:59Z',
        amount: 0.00,
        currency: 'USD',
        nextBillingDate: '2024-04-01T00:00:00Z',
        paymentMethod: 'none',
        lastPayment: null
      }
    ];

    res.json({
      success: true,
      data: {
        billing: billingData,
        total: billingData.length,
        summary: {
          totalRevenue: billingData.reduce((sum, item) => sum + item.amount, 0),
          activeSubscriptions: billingData.filter(item => item.status === 'active').length,
          conversionRate: ((billingData.filter(item => item.plan !== 'free').length / billingData.length) * 100).toFixed(1)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching billing data:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch billing data"
    });
  }
});

/**
 * GET /api/modules/billing/summary
 * Get billing summary (super admin only)
 */
router.get("/summary", requireSuperAdmin, async (req, res) => {
  try {
    const summary = {
      totalRevenue: 398.00,
      monthlyRecurringRevenue: 398.00,
      activeSubscriptions: 3,
      freeTrialUsers: 1,
      conversionRate: 66.7,
      averageRevenuePerUser: 132.67,
      churnRate: 0.0,
      lifetimeValue: 1592.00,
      period: {
        start: '2024-01-01',
        end: '2024-03-31'
      }
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch billing summary"
    });
  }
});

/**
 * GET /api/modules/billing/:organizationId
 * Get billing for specific organization (super admin only)
 */
router.get("/:organizationId", requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Mock organization billing data
    const organizationBilling = {
      organizationId,
      organizationName: 'Acme Corp',
      plan: 'enterprise',
      status: 'active',
      billingHistory: [
        {
          id: '1',
          date: '2024-01-01T00:00:00Z',
          amount: 299.00,
          currency: 'USD',
          status: 'paid',
          invoiceId: 'INV-2024-001'
        },
        {
          id: '2',
          date: '2023-12-01T00:00:00Z',
          amount: 299.00,
          currency: 'USD',
          status: 'paid',
          invoiceId: 'INV-2023-012'
        }
      ],
      currentPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
        amount: 299.00,
        currency: 'USD'
      },
      nextBilling: {
        date: '2024-02-01T00:00:00Z',
        amount: 299.00,
        currency: 'USD'
      }
    };

    res.json({
      success: true,
      data: organizationBilling
    });

  } catch (error) {
    console.error('Error fetching organization billing:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch organization billing"
    });
  }
});

/**
 * POST /api/modules/billing/:organizationId/invoice
 * Generate invoice for organization (super admin only)
 */
router.post("/:organizationId/invoice", requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { period, amount, currency = 'USD' } = req.body;
    
    // Mock invoice generation
    const invoice = {
      id: `INV-${Date.now()}`,
      organizationId,
      period,
      amount: amount || 299.00,
      currency,
      status: 'generated',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      downloadUrl: `/api/modules/billing/invoices/${Date.now()}/download`
    };

    res.status(201).json({
      success: true,
      data: { invoice },
      message: "Invoice generated successfully"
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate invoice"
    });
  }
});

/**
 * PUT /api/modules/billing/:organizationId/plan
 * Update organization plan (super admin only)
 */
router.put("/:organizationId/plan", requireSuperAdmin, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { plan, effectiveDate } = req.body;
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: "Plan is required"
      });
    }

    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan. Must be one of: free, pro, enterprise"
      });
    }

    // Mock plan update
    const planUpdate = {
      organizationId,
      oldPlan: 'enterprise',
      newPlan: plan,
      effectiveDate: effectiveDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      proratedAmount: plan === 'free' ? -299.00 : 0.00
    };

    res.json({
      success: true,
      data: planUpdate,
      message: "Plan updated successfully"
    });

  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update plan"
    });
  }
});

module.exports = router;
