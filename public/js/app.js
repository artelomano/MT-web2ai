// Menestystarinat AI UI - Main Application
console.log('🚀 Initializing Menestystarinat AI UI...');

// Global state
const appState = {
    currentConversationId: null,
    messageCount: 0,
    totalTokens: 0,
    currentModel: 'gpt-3.5-turbo',
    isLoading: false,
    knowledgeFiles: 0
};

// DOM Elements
const elements = {
    welcomeSection: document.getElementById('welcomeSection'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    modelSelector: document.getElementById('modelSelector'),
    modelSelectorModal: document.getElementById('modelSelectorModal'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    tokenInfo: document.getElementById('tokenInfo'),
    conversationInfo: document.getElementById('conversationInfo'),
    messageCount: document.getElementById('messageCount'),
    totalTokens: document.getElementById('totalTokens'),
    currentModel: document.getElementById('currentModel'),
    knowledgeFiles: document.getElementById('knowledgeFiles'),
    quickActionBtns: document.querySelectorAll('.quick-action-btn')
};

// Initialize application
function initApp() {
    console.log('📱 Initializing app components...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
    
    // Auto-resize textarea
    setupTextareaAutoResize();
    
    console.log('✅ App initialization complete');
}

// Set up all event listeners
function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Send button click
    elements.sendBtn.addEventListener('click', handleSendMessage);
    
    // Enter key in textarea
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Model selector change
    elements.modelSelector.addEventListener('change', handleModelChange);
    elements.modelSelectorModal.addEventListener('change', handleModelChange);
    
    // Settings modal
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
    
    // Quick action buttons
    elements.quickActionBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    console.log('✅ Event listeners set up');
}

// Load initial data from server
async function loadInitialData() {
    console.log('📊 Loading initial data...');
    
    try {
        // Load health check to get knowledge files count
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        
        appState.knowledgeFiles = healthData.knowledgeFiles;
        elements.knowledgeFiles.textContent = `${healthData.knowledgeFiles} files loaded`;
        
        console.log(`📚 Knowledge base: ${healthData.knowledgeFiles} files`);
        console.log(`💬 Active conversations: ${healthData.activeConversations}`);
        
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
    }
}

// Handle quick action button clicks
function handleQuickAction(event) {
    const prompt = event.currentTarget.dataset.prompt;
    console.log(`⚡ Quick action triggered: ${prompt}`);
    
    // Set the prompt in the input
    elements.messageInput.value = prompt;
    elements.messageInput.focus();
    
    // Enable send button
    elements.sendBtn.disabled = false;
    
    // Auto-resize the textarea to fit the content
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 150) + 'px';
    
    console.log('📝 Prompt added to input - user can now edit before sending');
}

// Handle model change
function handleModelChange(event) {
    const newModel = event.target.value;
    console.log(`🔄 Model changed to: ${newModel}`);
    
    appState.currentModel = newModel;
    elements.currentModel.textContent = newModel;
    
    // Update both selectors to stay in sync
    if (event.target === elements.modelSelector) {
        elements.modelSelectorModal.value = newModel;
    } else {
        elements.modelSelector.value = newModel;
    }
}

// Handle send message
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message || appState.isLoading) {
        console.log('⚠️ Message empty or already loading');
        return;
    }
    
    console.log(`💬 Sending message: "${message.substring(0, 50)}..."`);
    
    // Show loading state
    setLoadingState(true);
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    elements.messageInput.value = '';
    elements.sendBtn.disabled = true;
    
    try {
        // Call API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: appState.currentConversationId,
                modelName: appState.currentModel
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Response received - Tokens: ${data.tokensUsed}, Model: ${data.modelName}`);
        
        // Update conversation ID
        appState.currentConversationId = data.conversationId;
        
        // Add AI response to chat
        addMessageToChat('assistant', data.response);
        
        // Update stats
        updateStats(data.tokensUsed);
        
        // Update conversation info
        elements.conversationInfo.textContent = `Conversation: ${data.conversationId}`;
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        
        // Show error message
        addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.');
        
    } finally {
        setLoadingState(false);
    }
}

// Format AI response for better readability
function formatAIResponse(content) {
    console.log('🎨 Formatting AI response for better readability');
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    let formattedContent = '';
    
    paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
            // Check if paragraph starts with bullet points or numbered lists
            if (paragraph.match(/^[\s]*[•\-\*]\s/)) {
                // Format bullet points
                const items = paragraph.split(/\n/);
                items.forEach(item => {
                    if (item.trim()) {
                        formattedContent += `<div class="bullet-point">• ${item.replace(/^[\s]*[•\-\*]\s*/, '')}</div>`;
                    }
                });
            } else if (paragraph.match(/^[\s]*\d+\.\s/)) {
                // Format numbered lists
                const items = paragraph.split(/\n/);
                items.forEach(item => {
                    if (item.trim()) {
                        const number = item.match(/^[\s]*(\d+)\.\s/);
                        if (number) {
                            formattedContent += `<div class="numbered-item" data-number="${number[1]}">${item.replace(/^[\s]*\d+\.\s*/, '')}</div>`;
                        }
                    }
                });
            } else if (paragraph.match(/^[\s]*[A-Z][A-Z\s]+:/)) {
                // Format headers (all caps followed by colon)
                formattedContent += `<div class="section-header">${paragraph}</div>`;
            } else if (paragraph.match(/^[\s]*[A-Z][^:]*:$/)) {
                // Format section headers (ends with colon)
                formattedContent += `<div class="section-header">${paragraph}</div>`;
            } else {
                // Regular paragraph
                formattedContent += `<div class="paragraph">${paragraph}</div>`;
            }
            
            // Add spacing between paragraphs
            if (index < paragraphs.length - 1) {
                formattedContent += '<div class="paragraph-spacing"></div>';
            }
        }
    });
    
    return formattedContent;
}

// Add message to chat UI
function addMessageToChat(role, content) {
    console.log(`📝 Adding ${role} message to chat`);
    
    // Hide welcome section if this is the first message
    if (elements.welcomeSection.style.display !== 'none') {
        elements.welcomeSection.style.display = 'none';
        elements.chatMessages.style.display = 'flex';
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Format AI responses, keep user messages as plain text
    if (role === 'assistant') {
        messageContent.innerHTML = formatAIResponse(content);
    } else {
        messageContent.textContent = content;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    // Add to chat
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    // Update message count
    appState.messageCount++;
    elements.messageCount.textContent = appState.messageCount;
}

// Update statistics
function updateStats(tokensUsed) {
    appState.totalTokens += tokensUsed;
    elements.totalTokens.textContent = appState.totalTokens;
    elements.tokenInfo.textContent = `Tokens: ${appState.totalTokens}`;
    
    console.log(`📊 Stats updated - Total tokens: ${appState.totalTokens}`);
}

// Set loading state
function setLoadingState(loading) {
    appState.isLoading = loading;
    
    if (loading) {
        elements.loadingOverlay.style.display = 'flex';
        elements.sendBtn.disabled = true;
        console.log('⏳ Loading state enabled');
    } else {
        elements.loadingOverlay.style.display = 'none';
        elements.sendBtn.disabled = false;
        console.log('✅ Loading state disabled');
    }
}

// Open settings modal
function openSettings() {
    console.log('⚙️ Opening settings modal');
    elements.settingsModal.style.display = 'block';
    
    // Sync model selector
    elements.modelSelectorModal.value = appState.currentModel;
}

// Close settings modal
function closeSettings() {
    console.log('❌ Closing settings modal');
    elements.settingsModal.style.display = 'none';
}

// Auto-resize textarea
function setupTextareaAutoResize() {
    const textarea = elements.messageInput;
    
    textarea.addEventListener('input', function() {
        // Reset height to auto to get the correct scrollHeight
        this.style.height = 'auto';
        
        // Set the height to scrollHeight
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        
        // Enable/disable send button based on content
        elements.sendBtn.disabled = !this.value.trim();
    });
    
    console.log('📝 Textarea auto-resize configured');
}

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

// Utility function to estimate tokens (rough calculation)
function estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
}

// Error handling utility
function handleError(error, context) {
    console.error(`❌ Error in ${context}:`, error);
    
    // Show user-friendly error message
    addMessageToChat('assistant', 'I apologize, but I encountered an error. Please try again or contact support if the problem persists.');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, starting app...');
    initApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible');
        // Could reload data here if needed
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    console.log('👋 Page unloading, cleaning up...');
    // Could save state here if needed
});

// Export for debugging (if needed)
window.appState = appState;
window.elements = elements;

console.log('🎉 App script loaded successfully'); 