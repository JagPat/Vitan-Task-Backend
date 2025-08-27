const express = require('express');
const router = express.Router();

/**
 * POST /api/ai/analyze
 * Analyze user message and return AI response with suggestions
 */
router.post('/analyze', async (req, res) => {
  try {
    const { message, phoneNumber, language = 'en' } = req.body;
    
    if (!message || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Message and phone number are required'
      });
    }

    // Mock AI analysis for now
    const aiResponse = {
      intent: detectIntent(message),
      entities: extractEntities(message),
      language: language,
      reply: generateMockReply(message, language),
      confidence: 0.85,
      contextualSuggestions: generateMockSuggestions(message),
      promptVariant: 'v1'
    };

    res.json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] Error analyzing message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze message',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/whatsapp/process
 * Handle WhatsApp-specific messages
 */
router.post('/whatsapp/process', async (req, res) => {
  try {
    const { message, phoneNumber, language = 'en' } = req.body;
    
    if (!message || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Message and phone number are required'
      });
    }

    // Mock WhatsApp processing
    const whatsappResponse = {
      message: generateWhatsAppReply(message, language),
      intent: detectIntent(message),
      entities: extractEntities(message),
      confidence: 0.82,
      contextualSuggestions: generateMockSuggestions(message),
      userMemory: {
        onboardingStage: 1,
        preferredLanguage: language,
        lastInteraction: new Date().toISOString(),
        taskPatterns: {}
      }
    };

    res.json({
      success: true,
      data: whatsappResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] Error processing WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process WhatsApp message',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/prompts/variants/:intent/:language
 * Get prompt variants for A/B testing
 */
router.get('/prompts/variants/:intent/:language', async (req, res) => {
  try {
    const { intent, language } = req.params;
    
    // Mock prompt variants
    const variants = [
      {
        id: 1,
        intent,
        language,
        version: 1,
        prompt_text: `You are an AI assistant helping users with ${intent}. Be clear and helpful.`,
        success_rate: 0.75,
        test_count: 45,
        is_active: true
      },
      {
        id: 2,
        intent,
        language,
        version: 2,
        prompt_text: `You are an AI assistant helping users with ${intent}. Be clear, helpful, and ask for missing information when needed.`,
        success_rate: 0.82,
        test_count: 38,
        is_active: true
      }
    ];

    res.json({
      success: true,
      data: variants,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] Error getting prompt variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prompt variants',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/prompts/test-result
 * Log test results for prompt optimization
 */
router.post('/prompts/test-result', async (req, res) => {
  try {
    const { variant_id, intent, language, was_successful, confidence_score } = req.body;
    
    if (!variant_id || !intent || !language) {
      return res.status(400).json({
        success: false,
        error: 'variant_id, intent, and language are required'
      });
    }

    // Mock logging of test result
    console.log(`[AI Controller] Test result logged:`, {
      variant_id,
      intent,
      language,
      was_successful,
      confidence_score,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test result logged successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] Error logging test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log test result',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Controller is healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/ai/analyze',
      'POST /api/ai/whatsapp/process',
      'GET /api/ai/prompts/variants/:intent/:language',
      'POST /api/ai/prompts/test-result'
    ]
  });
});

// Helper functions for mock data
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('create') || lowerMessage.includes('new') || lowerMessage.includes('add')) {
    return 'create_task';
  }
  if (lowerMessage.includes('assign') || lowerMessage.includes('give') || lowerMessage.includes('hand over')) {
    return 'assign_task';
  }
  if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('check')) {
    return 'check_status';
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('guide')) {
    return 'help_request';
  }
  
  return 'general';
}

function extractEntities(message) {
  const entities = {};
  
  // Extract task title
  const titleMatch = message.match(/(?:create|new|add)\s+(?:a\s+)?task\s+(?:called\s+)?["']?([^"']+)["']?/i);
  if (titleMatch) {
    entities.task_title = titleMatch[1];
  }
  
  // Extract priority
  if (message.toLowerCase().includes('high priority') || message.toLowerCase().includes('urgent')) {
    entities.priority = 'high';
  } else if (message.toLowerCase().includes('low priority')) {
    entities.priority = 'low';
  }
  
  // Extract assignee
  const assigneeMatch = message.match(/(?:assign\s+to|give\s+to)\s+([a-zA-Z]+)/i);
  if (assigneeMatch) {
    entities.assignee = assigneeMatch[1];
  }
  
  return entities;
}

function generateMockReply(message, language) {
  const intent = detectIntent(message);
  const replies = {
    'en': {
      'create_task': 'I\'ll help you create a task. What would you like to name it?',
      'assign_task': 'I can help assign tasks. Who should this be assigned to?',
      'check_status': 'I\'ll check the status of your tasks. Which project are you interested in?',
      'help_request': 'I\'m here to help! What would you like to know about?',
      'general': 'I understand you\'re asking about task management. How can I assist you?'
    },
    'hi': {
      'create_task': 'मैं आपको कार्य बनाने में मदद करूंगा। आप इसे क्या नाम देना चाहते हैं?',
      'assign_task': 'मैं कार्य सौंपने में मदद कर सकता हूं। इसे किसे सौंपा जाना चाहिए?',
      'check_status': 'मैं आपके कार्यों की स्थिति की जांच करूंगा। आप किस प्रोजेक्ट में रुचि रखते हैं?',
      'help_request': 'मैं यहां मदद के लिए हूं! आप क्या जानना चाहते हैं?',
      'general': 'मैं समझता हूं कि आप कार्य प्रबंधन के बारे में पूछ रहे हैं। मैं आपकी कैसे मदद कर सकता हूं?'
    }
  };
  
  return replies[language]?.[intent] || replies['en'][intent] || replies['en']['general'];
}

function generateWhatsAppReply(message, language) {
  const intent = detectIntent(message);
  const replies = {
    'en': {
      'create_task': 'Great! Let\'s create a new task. 📝\n\nWhat would you like to name it?',
      'assign_task': 'Perfect! I can help assign tasks. 👥\n\nWho should this be assigned to?',
      'check_status': 'Sure! Let me check your task status. 📊\n\nWhich project are you interested in?',
      'help_request': 'Hi! I\'m your AI assistant. 🤖\n\nHow can I help you today?',
      'general': 'I\'m here to help with task management! 📋\n\nWhat would you like to do?'
    },
    'hi': {
      'create_task': 'बहुत अच्छा! चलिए एक नया कार्य बनाते हैं। 📝\n\nआप इसे क्या नाम देना चाहते हैं?',
      'assign_task': 'बिल्कुल! मैं कार्य सौंपने में मदद कर सकता हूं। 👥\n\nइसे किसे सौंपा जाना चाहिए?',
      'check_status': 'ज़रूर! मैं आपके कार्य की स्थिति की जांच करता हूं। 📊\n\nआप किस प्रोजेक्ट में रुचि रखते हैं?',
      'help_request': 'नमस्ते! मैं आपका AI सहायक हूं। 🤖\n\nमैं आज आपकी कैसे मदद कर सकता हूं?',
      'general': 'मैं कार्य प्रबंधन में मदद के लिए यहां हूं! 📋\n\nआप क्या करना चाहते हैं?'
    }
  };
  
  return replies[language]?.[intent] || replies['en'][intent] || replies['en']['general'];
}

function generateMockSuggestions(message) {
  const intent = detectIntent(message);
  
  const suggestions = {
    'create_task': [
      {
        type: 'priority',
        value: 'Set high priority for urgent tasks',
        confidence: 0.9,
        reasoning: 'Based on your message urgency',
        source: 'ai_pattern'
      },
      {
        type: 'checklist',
        value: 'Add checklist items for better tracking',
        confidence: 0.8,
        reasoning: 'Improves task completion tracking',
        source: 'best_practice'
      }
    ],
    'assign_task': [
      {
        type: 'assignee',
        value: 'Consider team workload before assigning',
        confidence: 0.85,
        reasoning: 'Ensures balanced distribution',
        source: 'ai_pattern'
      }
    ],
    'check_status': [
      {
        type: 'filter',
        value: 'Filter by project or status',
        confidence: 0.9,
        reasoning: 'Helps focus on relevant tasks',
        source: 'user_pattern'
      }
    ]
  };
  
  return suggestions[intent] || [];
}

module.exports = router;
