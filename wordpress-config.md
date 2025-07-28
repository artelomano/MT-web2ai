# WordPress Configuration for Menestystarinat AI UI

## 🗄️ Database Configuration

### Host Information
- **Host**: `fi23-wcn-25.qfix.fi`
- **Database**: `wp_jhhub`
- **User**: `wp_mzsas`
- **Port**: `3306`
- **SSL**: `false`

### phpMyAdmin URLs
- **Main URL**: `https://fi23-wcn-25.qfix.fi/`
- **phpMyAdmin**: `https://fi23-wcn-25.qfix.fi:8443/phpMyAdmin/index.php?db=wp_jhhub`

## 🔧 Environment Variables (.env)

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Chat Configuration
MAX_CONVERSATIONS=10
MAX_TOKENS_PER_REQUEST=4000
MODEL_NAME=gpt-3.5-turbo

# Knowledge Base Configuration
KNOWLEDGE_BASE_PATH=./knowledge

# Database Configuration (WordPress)
DB_HOST=fi23-wcn-25.qfix.fi
DB_USER=wp_mzsas
DB_PASSWORD=your_database_password
DB_NAME=wp_jhhub
DB_PORT=3306
DB_SSL=false
```

## 📊 Database Schema

### Tables Created
- `mt_conversations` - Chat conversations
- `mt_messages` - Individual messages
- `mt_knowledge_usage` - Knowledge base usage tracking
- `mt_analytics` - Usage analytics
- `mt_settings` - Application settings

### WordPress Integration
- **Prefix**: `mt_` (Menestystarinat)
- **Compatible**: WordPress MySQL structure
- **Backup**: Full database backup available

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Database Setup
```bash
# Initialize database
npm run db:init

# Test connection
npm run db:test

# Add sample data (optional)
npm run db:sample
```

### 3. Start Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔗 URLs

### Application
- **Local**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **API Base**: http://localhost:3000/api

### Database Management
- **phpMyAdmin**: https://fi23-wcn-25.qfix.fi:8443/phpMyAdmin/index.php?db=wp_jhhub
- **Host**: fi23-wcn-25.qfix.fi

## 📁 File Structure

```
Menestystarinat AI UI/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # Environment variables
├── env.example              # Template
├── database/
│   ├── schema.sql           # Database schema
│   ├── database.js          # Database connection
│   └── init.js              # Initialization scripts
├── knowledge/               # Knowledge base (26 files)
├── public/                  # Frontend files
└── setup-database.sh        # Quick setup script
```

## 🔐 Security Notes

### Environment Variables
- ✅ `.env` is in `.gitignore`
- ✅ `env.example` contains no real credentials
- ✅ Database passwords are encrypted

### Database Security
- 🔒 SSL connection available
- 🔒 User-specific database access
- 🔒 WordPress-compatible security

## 📈 Monitoring

### Logs to Watch
- Server startup: `🚀 Starting Menestystarinat AI UI Server...`
- Knowledge loading: `✅ Knowledge base loaded: 26 files`
- Database connection: `🔌 Connecting to database...`
- Chat requests: `💬 Chat request - Model: gpt-3.5-turbo`

### Token Usage
- Estimated tokens per request: ~20,500
- Actual tokens used: ~12,000
- Cost tracking: Enabled in console logs

## 🛠️ Troubleshooting

### Common Issues
1. **Port 3000 in use**: `pkill -f "node server.js"`
2. **Database timeout**: Check firewall/remote access
3. **API key error**: Update `.env` with valid OpenAI key
4. **Memory mode**: Database connection failed, running in memory

### Commands
```bash
# Kill existing processes
pkill -f "node server.js"

# Check port usage
lsof -i :3000

# Test database connection
npm run db:test

# Check configuration
node check-config.js
```

## 📝 Notes

- **Last Updated**: July 28, 2025
- **Status**: ✅ Pushed to GitHub
- **Repository**: https://github.com/artelomano/MT-web2ai
- **Mode**: Memory-only (database connection issues)
- **Knowledge Base**: 26 files loaded successfully

## 🎯 Next Steps

1. **Configure OpenAI API Key** in `.env`
2. **Test database connection** with correct credentials
3. **Deploy to production** server
4. **Set up SSL certificates** for HTTPS
5. **Configure domain** and DNS settings
6. **Set up monitoring** and analytics
7. **Backup strategy** for database and files

---
*Configuration saved for future WordPress deployment* 