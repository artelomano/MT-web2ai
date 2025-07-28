const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

class Database {
    constructor() {
        this.connection = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'wordpress',
            port: parseInt(process.env.DB_PORT) || 3306,
            charset: 'utf8mb4',
            timezone: '+00:00',
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.DB_SSL === 'true' ? {} : false,
            connectTimeout: 60000
        };
    }

    /**
     * Initialize database connection
     */
    async connect() {
        try {
            console.log('🔌 Connecting to database...');
            console.log('📊 Config:', {
                host: this.config.host,
                user: this.config.user,
                database: this.config.database,
                port: this.config.port,
                ssl: this.config.ssl
            });
            this.connection = await mysql.createConnection(this.config);
            console.log('✅ Database connected successfully');
            
            // Test the connection
            await this.connection.execute('SELECT 1');
            console.log('✅ Database connection test passed');
            
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            console.error('🔍 Error details:', error);
            return false;
        }
    }

    /**
     * Close database connection
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 Database connection closed');
        }
    }

    /**
     * Execute a query with parameters
     */
    async query(sql, params = []) {
        try {
            const [rows] = await this.connection.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('❌ Database query error:', error.message);
            throw error;
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(conversationId, modelName, userIp, userAgent) {
        const sql = `
            INSERT INTO mt_conversations 
            (conversation_id, model_name, user_ip, user_agent, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            updated_at = NOW()
        `;
        
        try {
            await this.query(sql, [conversationId, modelName, userIp, userAgent]);
            console.log(`📝 Created conversation: ${conversationId}`);
            return true;
        } catch (error) {
            console.error('❌ Error creating conversation:', error.message);
            return false;
        }
    }

    /**
     * Save a message to the database
     */
    async saveMessage(conversationId, messageId, role, content, tokensUsed, responseTimeMs, metadata = null) {
        const sql = `
            INSERT INTO mt_messages 
            (conversation_id, message_id, role, content, tokens_used, response_time_ms, metadata, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        try {
            await this.query(sql, [
                conversationId, 
                messageId, 
                role, 
                content, 
                tokensUsed, 
                responseTimeMs, 
                metadata ? JSON.stringify(metadata) : null
            ]);
            
            // Update conversation totals
            await this.updateConversationTotals(conversationId);
            
            console.log(`💬 Saved message: ${messageId} (${role})`);
            return true;
        } catch (error) {
            console.error('❌ Error saving message:', error.message);
            return false;
        }
    }

    /**
     * Update conversation totals
     */
    async updateConversationTotals(conversationId) {
        const sql = `
            UPDATE mt_conversations c
            SET 
                total_messages = (SELECT COUNT(*) FROM mt_messages WHERE conversation_id = ?),
                total_tokens = (SELECT COALESCE(SUM(tokens_used), 0) FROM mt_messages WHERE conversation_id = ?),
                updated_at = NOW()
            WHERE conversation_id = ?
        `;
        
        try {
            await this.query(sql, [conversationId, conversationId, conversationId]);
        } catch (error) {
            console.error('❌ Error updating conversation totals:', error.message);
        }
    }

    /**
     * Track knowledge file usage
     */
    async trackKnowledgeUsage(conversationId, messageId, knowledgeFile, relevanceScore = 0.5) {
        const sql = `
            INSERT INTO mt_knowledge_usage 
            (conversation_id, message_id, knowledge_file, relevance_score, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        try {
            await this.query(sql, [conversationId, messageId, knowledgeFile, relevanceScore]);
            console.log(`📚 Tracked knowledge usage: ${knowledgeFile}`);
            return true;
        } catch (error) {
            console.error('❌ Error tracking knowledge usage:', error.message);
            return false;
        }
    }

    /**
     * Get conversation history
     */
    async getConversationHistory(conversationId, limit = 50) {
        const sql = `
            SELECT 
                m.message_id,
                m.role,
                m.content,
                m.tokens_used,
                m.response_time_ms,
                m.created_at,
                m.metadata
            FROM mt_messages m
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
            LIMIT ?
        `;
        
        try {
            const messages = await this.query(sql, [conversationId, limit]);
            console.log(`📖 Retrieved ${messages.length} messages for conversation: ${conversationId}`);
            return messages;
        } catch (error) {
            console.error('❌ Error getting conversation history:', error.message);
            return [];
        }
    }

    /**
     * Get conversation summary
     */
    async getConversationSummary(conversationId) {
        const sql = `
            SELECT 
                conversation_id,
                model_name,
                total_tokens,
                total_messages,
                created_at,
                updated_at,
                status
            FROM mt_conversations
            WHERE conversation_id = ?
        `;
        
        try {
            const [conversation] = await this.query(sql, [conversationId]);
            return conversation;
        } catch (error) {
            console.error('❌ Error getting conversation summary:', error.message);
            return null;
        }
    }

    /**
     * Get recent conversations
     */
    async getRecentConversations(limit = 10) {
        const sql = `
            SELECT 
                conversation_id,
                model_name,
                total_tokens,
                total_messages,
                created_at,
                updated_at
            FROM mt_conversations
            WHERE status = 'active'
            ORDER BY updated_at DESC
            LIMIT ?
        `;
        
        try {
            const conversations = await this.query(sql, [limit]);
            console.log(`📋 Retrieved ${conversations.length} recent conversations`);
            return conversations;
        } catch (error) {
            console.error('❌ Error getting recent conversations:', error.message);
            return [];
        }
    }

    /**
     * Get analytics data
     */
    async getAnalytics(date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const sql = `
            SELECT 
                DATE(c.created_at) as date,
                COUNT(DISTINCT c.conversation_id) as conversations,
                COUNT(m.id) as messages,
                SUM(m.tokens_used) as total_tokens,
                AVG(m.response_time_ms) as avg_response_time,
                c.model_name
            FROM mt_conversations c
            LEFT JOIN mt_messages m ON c.conversation_id = m.conversation_id
            WHERE c.status = 'active' AND DATE(c.created_at) = ?
            GROUP BY DATE(c.created_at), c.model_name
        `;
        
        try {
            const analytics = await this.query(sql, [targetDate]);
            console.log(`📊 Retrieved analytics for date: ${targetDate}`);
            return analytics;
        } catch (error) {
            console.error('❌ Error getting analytics:', error.message);
            return [];
        }
    }

    /**
     * Get settings
     */
    async getSetting(key, defaultValue = null) {
        const sql = `
            SELECT setting_value, setting_type
            FROM mt_settings
            WHERE setting_key = ?
        `;
        
        try {
            const [setting] = await this.query(sql, [key]);
            if (!setting) return defaultValue;
            
            // Convert value based on type
            switch (setting.setting_type) {
                case 'number':
                    return parseInt(setting.setting_value);
                case 'boolean':
                    return setting.setting_value === 'true';
                case 'json':
                    return JSON.parse(setting.setting_value);
                default:
                    return setting.setting_value;
            }
        } catch (error) {
            console.error('❌ Error getting setting:', error.message);
            return defaultValue;
        }
    }

    /**
     * Update setting
     */
    async updateSetting(key, value, type = 'string') {
        const sql = `
            INSERT INTO mt_settings (setting_key, setting_value, setting_type, updated_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            setting_type = VALUES(setting_type),
            updated_at = NOW()
        `;
        
        try {
            await this.query(sql, [key, value, type]);
            console.log(`⚙️ Updated setting: ${key} = ${value}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating setting:', error.message);
            return false;
        }
    }

    /**
     * Clean old conversations
     */
    async cleanOldConversations(days = 30) {
        const sql = `
            UPDATE mt_conversations 
            SET status = 'archived'
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            AND status = 'active'
        `;
        
        try {
            const result = await this.query(sql, [days]);
            console.log(`🧹 Cleaned ${result.affectedRows} old conversations`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error cleaning old conversations:', error.message);
            return 0;
        }
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${uuidv4()}`;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.connection.execute('SELECT 1');
            return true;
        } catch (error) {
            console.error('❌ Database health check failed:', error.message);
            return false;
        }
    }
}

module.exports = Database; 