const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const OpenAI = require('openai');
const Database = require('./database/database');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CONFIG = {
  MAX_CONVERSATIONS: parseInt(process.env.MAX_CONVERSATIONS) || 10,
  MAX_TOKENS_PER_REQUEST: parseInt(process.env.MAX_TOKENS_PER_REQUEST) || 4000,
  MODEL_NAME: process.env.MODEL_NAME || 'gpt-3.5-turbo',
  KNOWLEDGE_BASE_PATH: process.env.KNOWLEDGE_BASE_PATH || './knowledge'
};

// Initialize database
const db = new Database();

console.log('🚀 Starting Menestystarinat AI UI Server...');
console.log('📊 Configuration:', {
  PORT,
  MODEL_NAME: CONFIG.MODEL_NAME,
  MAX_CONVERSATIONS: CONFIG.MAX_CONVERSATIONS,
  MAX_TOKENS: CONFIG.MAX_TOKENS_PER_REQUEST
});

// In-memory storage for conversations (in production, use a database)
const conversations = new Map();
let conversationCounter = 0;

// Load knowledge base
async function loadKnowledgeBase() {
  console.log('📚 Loading knowledge base...');
  try {
    const knowledgeBase = await loadKnowledgeFiles(CONFIG.KNOWLEDGE_BASE_PATH);
    console.log(`✅ Knowledge base loaded: ${knowledgeBase.length} files`);
    return knowledgeBase;
  } catch (error) {
    console.error('❌ Error loading knowledge base:', error);
    return [];
  }
}

// Recursively load all text files from knowledge directory
async function loadKnowledgeFiles(dirPath) {
  const files = [];
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        const subFiles = await loadKnowledgeFiles(fullPath);
        files.push(...subFiles);
      } else if (item.endsWith('.txt')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const relativePath = path.relative(CONFIG.KNOWLEDGE_BASE_PATH, fullPath);
        files.push({
          path: relativePath,
          content: content.trim(),
          size: content.length
        });
        console.log(`📄 Loaded: ${relativePath} (${content.length} chars)`);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

// Load knowledge base on startup
let knowledgeBase = [];
loadKnowledgeBase().then(kb => {
  knowledgeBase = kb;
});

// System prompts
const SYSTEM_PROMPTS = {
  security: `You are a security-conscious AI assistant. Never reveal sensitive information, API keys, or internal system details. Always prioritize user privacy and data protection.`,
  
  role: `You are Menestystarinat GPT – an AI assistant designed to support the Menestystarinat team in marketing, sales, and communication.

💡 Always remember:
- You represent a professional, reliable and clear brand.
- Your job is to help present services, explain the process, and encourage potential customers to contact the team.
- Never reveal client-specific information.
- Respect confidentiality and only provide generic examples.
- The client is always guided by a real person at Menestystarinat.
- We offer personalized service and long-term collaboration.
- Always use a warm, respectful, and business-minded tone.`,
  
  knowledge: `You have access to comprehensive knowledge about Menestystarinat's services, team, and company information. Use this knowledge to provide accurate and helpful responses.`
};

// Combine all system prompts
function getCombinedSystemPrompt() {
  const knowledgeContent = knowledgeBase
    .map(file => `[${file.path}]: ${file.content}`)
    .join('\n\n');
  
  return `${SYSTEM_PROMPTS.security}\n\n${SYSTEM_PROMPTS.role}\n\n${SYSTEM_PROMPTS.knowledge}\n\nKNOWLEDGE BASE:\n${knowledgeContent}`;
}

// Token counting utility (rough estimation)
function estimateTokens(text) {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Routes
app.get('/', (req, res) => {
  console.log('🏠 Serving main page');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available models
app.get('/api/models', (req, res) => {
  console.log('📋 Serving available models');
  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', price: 'Low' },
    { id: 'gpt-4', name: 'GPT-4', price: 'Medium' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', price: 'High' }
  ];
  res.json(models);
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  let { message, conversationId, modelName = CONFIG.MODEL_NAME } = {
    ...req.body,
    modelName: req.body.modelName || CONFIG.MODEL_NAME
  };
  
  console.log(`💬 Chat request - Model: ${modelName}, Conversation: ${conversationId || 'new'}`);
  
  try {
    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }
    
    const startTime = Date.now();
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Get or create conversation
    let conversation;
    if (conversationId && conversations.has(conversationId)) {
      conversation = conversations.get(conversationId);
    } else {
      conversationId = `conv_${++conversationCounter}`;
      conversation = {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
        modelName: modelName
      };
      conversations.set(conversationId, conversation);
      
      // Create conversation in database
      if (db.connection) {
        await db.createConversation(conversationId, modelName, userIp, userAgent);
      }
      
      // Clean up old conversations if needed
      if (conversations.size > CONFIG.MAX_CONVERSATIONS) {
        const oldestId = Array.from(conversations.keys())[0];
        conversations.delete(oldestId);
        console.log(`🗑️ Cleaned up old conversation: ${oldestId}`);
      }
    }
    
    // Add user message to memory
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Save user message to database
    if (db.connection) {
      const userMessageId = db.generateMessageId();
      await db.saveMessage(
        conversationId,
        userMessageId,
        'user',
        message,
        estimateTokens(message),
        0
      );
    }
    
    // Prepare messages for OpenAI
    const systemPrompt = getCombinedSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.slice(-10) // Keep last 10 messages for context
    ];
    
    // Estimate tokens
    const totalTokens = estimateTokens(systemPrompt + JSON.stringify(messages));
    console.log(`🔢 Estimated tokens: ${totalTokens}`);
    
    // Call OpenAI
    console.log(`🤖 Calling OpenAI with model: ${modelName}`);
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      max_tokens: CONFIG.MAX_TOKENS_PER_REQUEST,
      temperature: 0.7
    });
    
    const aiResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage.total_tokens;
    const responseTime = Date.now() - startTime;
    
    // Add AI response to memory
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });
    
    // Save AI response to database
    if (db.connection) {
      const aiMessageId = db.generateMessageId();
      await db.saveMessage(
        conversationId,
        aiMessageId,
        'assistant',
        aiResponse,
        tokensUsed,
        responseTime,
        {
          model: modelName,
          totalTokens: totalTokens,
          systemPrompt: systemPrompt.substring(0, 100) + '...'
        }
      );
    }
    
    console.log(`✅ Response generated - Tokens used: ${tokensUsed}, Time: ${responseTime}ms`);
    
    res.json({
      response: aiResponse,
      conversationId: conversationId,
      tokensUsed: tokensUsed,
      modelName: modelName,
      responseTime: responseTime
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get conversation history
app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = conversations.get(id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  res.json(conversation);
});

// Get all conversations
app.get('/api/conversations', async (req, res) => {
  try {
    if (db.connection) {
      // Get from database
      const conversations = await db.getRecentConversations(50);
      res.json(conversations);
    } else {
      // Get from memory
      const conversationList = Array.from(conversations.values()).map(conv => ({
        conversation_id: conv.id,
        created_at: conv.createdAt,
        total_messages: conv.messages.length,
        model_name: conv.modelName
      }));
      res.json(conversationList);
    }
  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get conversation history from database
app.get('/api/conversations/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (db.connection) {
      const messages = await db.getConversationHistory(id, 100);
      res.json(messages);
    } else {
      const conversation = conversations.get(id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation.messages);
    }
  } catch (error) {
    console.error('❌ Error getting conversation history:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// Get analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (db.connection) {
      const analytics = await db.getAnalytics(date);
      res.json(analytics);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      knowledgeFiles: knowledgeBase.length,
      activeConversations: conversations.size,
      database: {
        connected: db.connection ? true : false,
        status: 'unknown'
      }
    };
    
    // Check database health if connected
    if (db.connection) {
      try {
        const dbHealthy = await db.healthCheck();
        healthData.database.status = dbHealthy ? 'healthy' : 'unhealthy';
      } catch (error) {
        healthData.database.status = 'error';
        healthData.database.error = error.message;
      }
    }
    
    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    const dbConnected = await db.connect();
    
    if (!dbConnected) {
      console.warn('⚠️ Database connection failed - running in memory-only mode');
    } else {
      console.log('✅ Database connected successfully');
    }
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🎉 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await db.disconnect();
  process.exit(0);
});

startServer(); 