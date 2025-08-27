const express = require('express');
const router = express.Router();

// Mock user memory storage (in production, this would be a database)
const userMemoryStore = new Map();

/**
 * GET /api/ai/learning/user-context/:phoneNumber
 * Returns memory context of user by phone number
 */
router.get('/user-context/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Get existing user context or create new one
    let userContext = userMemoryStore.get(phoneNumber);
    
    if (!userContext) {
      // Initialize new user context
      userContext = {
        phoneNumber,
        onboardingStage: 1,
        preferredLanguage: 'en',
        lastInteractionAt: new Date().toISOString(),
        taskPatterns: {},
        projectPreferences: {},
        aiInteractionHistory: [],
        userPreferences: {},
        learningData: {},
        correctionHistory: [],
        failedSuggestions: {}
      };
      
      // Store the new context
      userMemoryStore.set(phoneNumber, userContext);
    }

    res.json({
      success: true,
      data: userContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[User Memory Controller] Error getting user context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user context',
      details: error.message
    });
  }
});

/**
 * PUT /api/ai/learning/user-context/:phoneNumber
 * Updates memory context with new preferences, failed suggestions, etc.
 */
router.put('/user-context/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const updates = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Update data is required'
      });
    }

    // Get existing user context
    let userContext = userMemoryStore.get(phoneNumber);
    
    if (!userContext) {
      return res.status(404).json({
        success: false,
        error: 'User context not found'
      });
    }

    // Apply updates
    const updatedContext = { ...userContext, ...updates };
    
    // Handle special cases for arrays and objects
    if (updates.aiInteractionHistory) {
      updatedContext.aiInteractionHistory = [
        ...(userContext.aiInteractionHistory || []),
        ...(Array.isArray(updates.aiInteractionHistory) ? updates.aiInteractionHistory : [updates.aiInteractionHistory])
      ];
      
      // Keep only last 50 interactions
      if (updatedContext.aiInteractionHistory.length > 50) {
        updatedContext.aiInteractionHistory = updatedContext.aiInteractionHistory.slice(-50);
      }
    }

    if (updates.correctionHistory) {
      updatedContext.correctionHistory = [
        ...(userContext.correctionHistory || []),
        ...(Array.isArray(updates.correctionHistory) ? updates.correctionHistory : [updates.correctionHistory])
      ];
      
      // Keep only last 20 corrections
      if (updatedContext.correctionHistory.length > 20) {
        updatedContext.correctionHistory = updatedContext.correctionHistory.slice(-20);
      }
    }

    if (updates.failedSuggestions) {
      updatedContext.failedSuggestions = {
        ...(userContext.failedSuggestions || {}),
        ...updates.failedSuggestions
      };
    }

    if (updates.taskPatterns) {
      updatedContext.taskPatterns = {
        ...(userContext.taskPatterns || {}),
        ...updates.taskPatterns
      };
    }

    // Update timestamp
    updatedContext.lastInteractionAt = new Date().toISOString();
    
    // Store updated context
    userMemoryStore.set(phoneNumber, updatedContext);

    res.json({
      success: true,
      message: 'User context updated successfully',
      data: updatedContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[User Memory Controller] Error updating user context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user context',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/learning/log-interaction
 * Logs a new AI interaction for learning purposes
 */
router.post('/log-interaction', async (req, res) => {
  try {
    const { phoneNumber, interaction } = req.body;
    
    if (!phoneNumber || !interaction) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and interaction data are required'
      });
    }

    // Get user context
    let userContext = userMemoryStore.get(phoneNumber);
    
    if (!userContext) {
      return res.status(404).json({
        success: false,
        error: 'User context not found'
      });
    }

    // Add interaction to history
    const newInteraction = {
      ...interaction,
      timestamp: new Date().toISOString(),
      id: `interaction_${Date.now()}`
    };

    userContext.aiInteractionHistory = [
      ...(userContext.aiInteractionHistory || []),
      newInteraction
    ];

    // Keep only last 50 interactions
    if (userContext.aiInteractionHistory.length > 50) {
      userContext.aiInteractionHistory = userContext.aiInteractionHistory.slice(-50);
    }

    // Update last interaction timestamp
    userContext.lastInteractionAt = new Date().toISOString();

    // Store updated context
    userMemoryStore.set(phoneNumber, userContext);

    res.json({
      success: true,
      message: 'Interaction logged successfully',
      interactionId: newInteraction.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[User Memory Controller] Error logging interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log interaction',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/learning/log-correction
 * Logs user corrections for failed AI suggestions
 */
router.post('/log-correction', async (req, res) => {
  try {
    const { phoneNumber, correction } = req.body;
    
    if (!phoneNumber || !correction) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and correction data are required'
      });
    }

    // Get user context
    let userContext = userMemoryStore.get(phoneNumber);
    
    if (!userContext) {
      return res.status(404).json({
        success: false,
        error: 'User context not found'
      });
    }

    // Add correction to history
    const newCorrection = {
      ...correction,
      timestamp: new Date().toISOString(),
      id: `correction_${Date.now()}`
    };

    userContext.correctionHistory = [
      ...(userContext.correctionHistory || []),
      newCorrection
    ];

    // Keep only last 20 corrections
    if (userContext.correctionHistory.length > 20) {
      userContext.correctionHistory = userContext.correctionHistory.slice(-20);
    }

    // Update failed suggestions tracking
    if (correction.intent && correction.originalSuggestion) {
      if (!userContext.failedSuggestions[correction.intent]) {
        userContext.failedSuggestions[correction.intent] = [];
      }

      const failedSuggestion = {
        suggestion: correction.originalSuggestion,
        failureCount: 1,
        lastFailed: new Date().toISOString(),
        context: correction.context || {}
      };

      // Check if this suggestion already exists
      const existingIndex = userContext.failedSuggestions[correction.intent]
        .findIndex(s => s.suggestion === correction.originalSuggestion);

      if (existingIndex >= 0) {
        userContext.failedSuggestions[correction.intent][existingIndex].failureCount += 1;
        userContext.failedSuggestions[correction.intent][existingIndex].lastFailed = new Date().toISOString();
      } else {
        userContext.failedSuggestions[correction.intent].push(failedSuggestion);
      }
    }

    // Store updated context
    userMemoryStore.set(phoneNumber, userContext);

    res.json({
      success: true,
      message: 'Correction logged successfully',
      correctionId: newCorrection.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[User Memory Controller] Error logging correction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log correction',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/learning/patterns/:phoneNumber
 * Returns learning patterns and insights for a user
 */
router.get('/patterns/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Get user context
    const userContext = userMemoryStore.get(phoneNumber);
    
    if (!userContext) {
      return res.status(404).json({
        success: false,
        error: 'User context not found'
      });
    }

    // Generate patterns from user data
    const patterns = {
      taskPatterns: userContext.taskPatterns || {},
      projectPreferences: userContext.projectPreferences || {},
      commonIntents: analyzeCommonIntents(userContext.aiInteractionHistory || []),
      correctionPatterns: analyzeCorrectionPatterns(userContext.correctionHistory || []),
      learningProgress: {
        totalInteractions: (userContext.aiInteractionHistory || []).length,
        totalCorrections: (userContext.correctionHistory || []).length,
        onboardingStage: userContext.onboardingStage,
        preferredLanguage: userContext.preferredLanguage
      }
    };

    res.json({
      success: true,
      data: patterns,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[User Memory Controller] Error getting patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning patterns',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/learning/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User Memory Controller is healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/ai/learning/user-context/:phoneNumber',
      'PUT /api/ai/learning/user-context/:phoneNumber',
      'POST /api/ai/learning/log-interaction',
      'POST /api/ai/learning/log-correction',
      'GET /api/ai/learning/patterns/:phoneNumber'
    ],
    stats: {
      totalUsers: userMemoryStore.size,
      totalInteractions: Array.from(userMemoryStore.values())
        .reduce((sum, user) => sum + (user.aiInteractionHistory?.length || 0), 0),
      totalCorrections: Array.from(userMemoryStore.values())
        .reduce((sum, user) => sum + (user.correctionHistory?.length || 0), 0)
    }
  });
});

// Helper functions
function analyzeCommonIntents(interactions) {
  const intentCounts = {};
  
  interactions.forEach(interaction => {
    const intent = interaction.intent || 'unknown';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  });

  return Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzeCorrectionPatterns(corrections) {
  const intentCorrections = {};
  
  corrections.forEach(correction => {
    const intent = correction.intent || 'unknown';
    if (!intentCorrections[intent]) {
      intentCorrections[intent] = [];
    }
    intentCorrections[intent].push(correction);
  });

  return Object.entries(intentCorrections)
    .map(([intent, corrections]) => ({
      intent,
      correctionCount: corrections.length,
      commonIssues: corrections.map(c => c.userCorrection).slice(0, 3)
    }))
    .sort((a, b) => b.correctionCount - a.correctionCount);
}

module.exports = router;
