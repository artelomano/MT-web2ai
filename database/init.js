require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const Database = require('./database');

class DatabaseInitializer {
    constructor() {
        this.db = new Database();
    }

    /**
     * Initialize database with schema
     */
    async initialize() {
        try {
            console.log('🚀 Starting database initialization...');
            
            // Connect to database
            const connected = await this.db.connect();
            if (!connected) {
                console.error('❌ Failed to connect to database');
                return false;
            }

            // Read and execute schema
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = await fs.readFile(schemaPath, 'utf8');
            
            // Split schema into individual statements
            const statements = schema
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            console.log(`📋 Executing ${statements.length} SQL statements...`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        await this.db.query(statement);
                        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
                    } catch (error) {
                        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                        // Continue with other statements
                    }
                }
            }

            console.log('✅ Database initialization completed successfully');
            return true;

        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            return false;
        } finally {
            await this.db.disconnect();
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            console.log('🔌 Testing database connection...');
            
            const connected = await this.db.connect();
            if (!connected) {
                console.error('❌ Database connection failed');
                return false;
            }

            // Test basic queries
            const tables = await this.db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = ? AND table_name LIKE 'mt_%'
            `, [process.env.DB_NAME || 'wordpress']);

            console.log(`✅ Found ${tables.length} Menestystarinat tables:`);
            tables.forEach(table => {
                console.log(`  - ${table.table_name}`);
            });

            // Test settings table
            const settings = await this.db.query('SELECT COUNT(*) as count FROM mt_settings');
            console.log(`✅ Settings table has ${settings[0].count} records`);

            await this.db.disconnect();
            return true;

        } catch (error) {
            console.error('❌ Database test failed:', error.message);
            return false;
        }
    }

    /**
     * Create sample data
     */
    async createSampleData() {
        try {
            console.log('📝 Creating sample data...');
            
            const connected = await this.db.connect();
            if (!connected) {
                console.error('❌ Failed to connect to database');
                return false;
            }

            // Create sample conversation
            const conversationId = 'sample_conv_' + Date.now();
            await this.db.createConversation(conversationId, 'gpt-3.5-turbo', '127.0.0.1', 'Sample User Agent');

            // Create sample messages
            const messageId1 = this.db.generateMessageId();
            const messageId2 = this.db.generateMessageId();

            await this.db.saveMessage(
                conversationId,
                messageId1,
                'user',
                'Hello, what services do you offer?',
                10,
                1500
            );

            await this.db.saveMessage(
                conversationId,
                messageId2,
                'assistant',
                'We offer web development, SEO, branding, and digital marketing services. How can I help you today?',
                25,
                2500
            );

            console.log('✅ Sample data created successfully');
            return true;

        } catch (error) {
            console.error('❌ Error creating sample data:', error.message);
            return false;
        } finally {
            await this.db.disconnect();
        }
    }
}

// CLI interface
if (require.main === module) {
    const init = new DatabaseInitializer();
    const command = process.argv[2];

    switch (command) {
        case 'init':
            init.initialize().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'test':
            init.testConnection().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'sample':
            init.createSampleData().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        default:
            console.log('Usage: node init.js [init|test|sample]');
            console.log('  init   - Initialize database schema');
            console.log('  test   - Test database connection');
            console.log('  sample - Create sample data');
            process.exit(1);
    }
}

module.exports = DatabaseInitializer; 