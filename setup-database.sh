#!/bin/bash

# =====================================================
# Menestystarinat AI UI - Database Setup Script
# =====================================================

echo "🚀 Menestystarinat AI UI - Database Setup"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "You can copy from env.example:"
    echo "cp env.example .env"
    exit 1
fi

# Check if database configuration is set
if ! grep -q "DB_HOST" .env; then
    echo "⚠️ Database configuration not found in .env"
    echo "Adding database configuration to .env..."
    echo "" >> .env
    echo "# Database Configuration" >> .env
    echo "DB_HOST=localhost" >> .env
    echo "DB_USER=root" >> .env
    echo "DB_PASSWORD=your_database_password" >> .env
    echo "DB_NAME=wordpress" >> .env
    echo "DB_PORT=3306" >> .env
    echo "✅ Database configuration added to .env"
    echo "⚠️ Please update DB_PASSWORD with your actual database password"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test database connection
echo "🔌 Testing database connection..."
npm run db:test

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    
    # Initialize database
    echo "🗄️ Initializing database schema..."
    npm run db:init
    
    if [ $? -eq 0 ]; then
        echo "✅ Database initialized successfully!"
        
        # Create sample data
        echo "📝 Creating sample data..."
        npm run db:sample
        
        if [ $? -eq 0 ]; then
            echo "✅ Sample data created successfully!"
        else
            echo "⚠️ Sample data creation failed (this is optional)"
        fi
    else
        echo "❌ Database initialization failed!"
        exit 1
    fi
else
    echo "❌ Database connection failed!"
    echo "Please check your database configuration in .env"
    echo "Make sure MySQL is running and credentials are correct"
    exit 1
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with correct database credentials"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:3000 to test the application"
echo ""
echo "📚 For more information, see database/README.md" 