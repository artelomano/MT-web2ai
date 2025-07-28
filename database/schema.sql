-- =====================================================
-- Menestystarinat AI UI - Database Schema
-- WordPress Compatible Tables
-- =====================================================

-- Table: mt_conversations (Menestystarinat Tables)
-- Stores conversation metadata and settings
-- Prefix: mt_ (Menestystarinat Tables)
CREATE TABLE IF NOT EXISTS `mt_conversations` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `conversation_id` varchar(255) NOT NULL,
    `user_ip` varchar(45) DEFAULT NULL,
    `user_agent` text,
    `model_name` varchar(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
    `total_tokens` int(11) DEFAULT 0,
    `total_messages` int(11) DEFAULT 0,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `status` enum('active','archived','deleted') NOT NULL DEFAULT 'active',
    `metadata` longtext,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversation_id` (`conversation_id`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_status` (`status`),
    KEY `idx_model` (`model_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mt_messages
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS `mt_messages` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `conversation_id` varchar(255) NOT NULL,
    `message_id` varchar(255) NOT NULL,
    `role` enum('user','assistant','system') NOT NULL,
    `content` longtext NOT NULL,
    `tokens_used` int(11) DEFAULT 0,
    `response_time_ms` int(11) DEFAULT 0,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `metadata` longtext,
    PRIMARY KEY (`id`),
    UNIQUE KEY `message_id` (`message_id`),
    KEY `idx_conversation_id` (`conversation_id`),
    KEY `idx_role` (`role`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `mt_conversations` (`conversation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mt_knowledge_usage
-- Tracks which knowledge files were used in responses
CREATE TABLE IF NOT EXISTS `mt_knowledge_usage` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `conversation_id` varchar(255) NOT NULL,
    `message_id` varchar(255) NOT NULL,
    `knowledge_file` varchar(500) NOT NULL,
    `relevance_score` decimal(3,2) DEFAULT 0.00,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_conversation_id` (`conversation_id`),
    KEY `idx_message_id` (`message_id`),
    KEY `idx_knowledge_file` (`knowledge_file`),
    CONSTRAINT `fk_knowledge_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `mt_conversations` (`conversation_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_knowledge_message` FOREIGN KEY (`message_id`) REFERENCES `mt_messages` (`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mt_analytics
-- Stores analytics and usage statistics
CREATE TABLE IF NOT EXISTS `mt_analytics` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `total_conversations` int(11) DEFAULT 0,
    `total_messages` int(11) DEFAULT 0,
    `total_tokens` bigint(20) DEFAULT 0,
    `avg_response_time_ms` int(11) DEFAULT 0,
    `most_used_model` varchar(100) DEFAULT NULL,
    `most_used_knowledge_file` varchar(500) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `date` (`date`),
    KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mt_settings
-- Stores application settings and configuration
CREATE TABLE IF NOT EXISTS `mt_settings` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `setting_key` varchar(255) NOT NULL,
    `setting_value` longtext,
    `setting_type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
    `description` text,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT IGNORE INTO `mt_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('max_conversations', '10', 'number', 'Maximum number of conversations to keep in memory'),
('max_tokens_per_request', '4000', 'number', 'Maximum tokens per API request'),
('default_model', 'gpt-3.5-turbo', 'string', 'Default AI model to use'),
('knowledge_base_path', './knowledge', 'string', 'Path to knowledge base directory'),
('enable_analytics', 'true', 'boolean', 'Enable analytics tracking'),
('retention_days', '30', 'number', 'Number of days to keep conversation data');

-- =====================================================
-- Indexes for better performance
-- =====================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_conversations_user_ip` ON `mt_conversations` (`user_ip`);
CREATE INDEX IF NOT EXISTS `idx_conversations_model_created` ON `mt_conversations` (`model_name`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_messages_conversation_role` ON `mt_messages` (`conversation_id`, `role`);
CREATE INDEX IF NOT EXISTS `idx_messages_tokens` ON `mt_messages` (`tokens_used`);
CREATE INDEX IF NOT EXISTS `idx_knowledge_relevance` ON `mt_knowledge_usage` (`relevance_score`);

-- =====================================================
-- Views for common queries
-- =====================================================

-- View: Conversation Summary
CREATE OR REPLACE VIEW `mt_conversation_summary` AS
SELECT 
    c.conversation_id,
    c.model_name,
    c.total_tokens,
    c.total_messages,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count,
    SUM(m.tokens_used) as total_tokens_used,
    AVG(m.response_time_ms) as avg_response_time
FROM mt_conversations c
LEFT JOIN mt_messages m ON c.conversation_id = m.conversation_id
WHERE c.status = 'active'
GROUP BY c.conversation_id;

-- View: Daily Analytics
CREATE OR REPLACE VIEW `mt_daily_analytics` AS
SELECT 
    DATE(c.created_at) as date,
    COUNT(DISTINCT c.conversation_id) as conversations,
    COUNT(m.id) as messages,
    SUM(m.tokens_used) as tokens,
    AVG(m.response_time_ms) as avg_response_time,
    c.model_name
FROM mt_conversations c
LEFT JOIN mt_messages m ON c.conversation_id = m.conversation_id
WHERE c.status = 'active'
GROUP BY DATE(c.created_at), c.model_name; 