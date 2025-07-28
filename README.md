# Menestystarinat AI UI

A modern, AI-powered chatbot web interface for Menestystarinat marketing agency. This application provides an intelligent assistant that can answer questions about services, team, and company information using OpenAI's GPT models.

## 🚀 Features

- **AI-Powered Chatbot**: Intelligent responses using OpenAI GPT models
- **Knowledge Base Integration**: Loads and uses company information from text files
- **Multiple AI Models**: Support for GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo
- **Modern UI**: Clean, responsive design similar to ChatGPT
- **Quick Actions**: 9 pre-defined question buttons for common inquiries
- **Token Tracking**: Monitor token usage for cost control
- **Conversation Memory**: Maintains conversation history (10 conversations max)
- **Real-time Stats**: Live tracking of messages and tokens used
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Database Integration**: Persistent storage of conversations and analytics (MySQL)
- **Advanced Analytics**: Detailed usage statistics and performance metrics
- **WordPress Compatibility**: Database tables compatible with WordPress installations

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: OpenAI GPT API
- **Database**: MySQL with mysql2 driver
- **Styling**: Custom CSS with modern design patterns
- **File System**: fs-extra for knowledge base loading
- **Utilities**: UUID generation, environment management

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd menestystarinat-ai-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

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
```

### 4. Add Your Knowledge Base

Place your `.txt` files in the `knowledge/` directory. The application will automatically load all text files recursively from this directory.

Example structure:
```
knowledge/
├── company_information.txt
├── services/
│   ├── ads.txt
│   ├── seo.txt
│   └── web.txt
├── team_members/
│   ├── alberto_grande.txt
│   └── hanna_makinen.txt
└── references/
    └── case_studies.txt
```

### 5. Database Setup (Optional but Recommended)

For persistent storage of conversations and analytics:

```bash
# Quick setup with automatic configuration
./setup-database.sh

# Or manual setup:
npm run db:init    # Initialize database schema
npm run db:test    # Test database connection
npm run db:sample  # Create sample data
```

**Database Configuration:**
Add these variables to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=wordpress
DB_PORT=3306
```

### 6. Start the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
menestystarinat-ai-ui/
├── knowledge/                 # Knowledge base files
│   ├── company_information.txt
│   ├── services/
│   ├── team_members/
│   └── references/
├── public/                    # Static files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   ├── images/
│   └── index.html
├── server.js                  # Main server file
├── package.json
├── .env                       # Environment variables (not in git)
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MAX_CONVERSATIONS` | Maximum conversations in memory | 10 |
| `MAX_TOKENS_PER_REQUEST` | Max tokens per API call | 4000 |
| `MODEL_NAME` | Default AI model | gpt-3.5-turbo |
| `KNOWLEDGE_BASE_PATH` | Path to knowledge files | ./knowledge |

### Knowledge Base

The application automatically loads all `.txt` files from the knowledge directory. Files are organized by:

- **Company Information**: General company details
- **Services**: Information about offered services
- **Team Members**: Staff information and expertise
- **References**: Case studies and client feedback

## 🎨 Customization

### Styling

The application uses a modern dark theme with teal accents. You can customize the appearance by editing `public/css/style.css`.

### Quick Actions

Modify the 9 quick action buttons in `public/index.html` to match your specific use cases:

```html
<button class="quick-action-btn" data-prompt="Your custom prompt here">
    <span class="btn-icon">🎯</span>
    <span class="btn-text">Button Text</span>
</button>
```

### System Prompts

Edit the system prompts in `server.js` to customize the AI's behavior:

```javascript
const SYSTEM_PROMPTS = {
    security: `Your security prompt...`,
    role: `Your role prompt...`,
    knowledge: `Your knowledge prompt...`
};
```

## 🔍 API Endpoints

### Chat
- `POST /api/chat` - Send a message and get AI response

### Models
- `GET /api/models` - Get available AI models

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation

### Health
- `GET /api/health` - Application health check

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Ensure all environment variables are configured
3. Start the application:

```bash
npm start
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t menestystarinat-ai-ui .
docker run -p 3000:3000 --env-file .env menestystarinat-ai-ui
```

## 🔒 Security Considerations

- **API Key Protection**: Never commit your `.env` file to version control
- **Input Validation**: All user inputs are validated on the server
- **Rate Limiting**: Consider implementing rate limiting for production use
- **HTTPS**: Use HTTPS in production environments

## 📊 Monitoring

The application includes comprehensive logging:

- Console logs for debugging
- Token usage tracking
- Conversation management
- Error handling and reporting
- Database health monitoring
- Analytics and performance metrics

## 🗄️ Database Features

### **Persistent Storage**
- All conversations are stored in MySQL database
- Message history with timestamps and metadata
- Token usage tracking per conversation
- User IP and user agent tracking

### **Analytics & Reporting**
- Daily conversation statistics
- Token usage analytics
- Response time metrics
- Model usage statistics
- Knowledge file relevance tracking

### **Database Schema**
- **mt_conversations**: Conversation metadata
- **mt_messages**: Individual messages
- **mt_knowledge_usage**: Knowledge file usage
- **mt_analytics**: Usage statistics
- **mt_settings**: Application configuration

### **API Endpoints**
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id/history` - Get conversation history
- `GET /api/analytics` - Get usage analytics
- `GET /api/health` - System health (includes DB status)

For detailed database documentation, see [`database/README.md`](database/README.md).

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Error**
   - Verify your API key is correct
   - Check your OpenAI account has sufficient credits
   - Ensure the API key has the correct permissions

2. **Knowledge Base Not Loading**
   - Verify files are in the correct directory
   - Check file permissions
   - Ensure files are `.txt` format

3. **Port Already in Use**
   - Change the PORT in your `.env` file
   - Kill the process using the port: `lsof -ti:3000 | xargs kill`

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions:
- Email: info@menestystarinat.fi
- Phone: +358 9 4245 6094
- Website: https://www.menestystarinat.fi

## 🔄 Updates

To update the application:

1. Pull the latest changes: `git pull origin main`
2. Install new dependencies: `npm install`
3. Restart the application: `npm start`

---

**Built with ❤️ by Menestystarinat Team** 