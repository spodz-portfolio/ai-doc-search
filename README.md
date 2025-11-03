# 🤖 AI Chat Application

A full-stack AI chatbot application with a React TypeScript frontend and Node.js Express backend, powered by OpenAI's GPT-4o-mini model.

## ✨ Features

### Frontend (React TypeScript)
- 🎨 **Modern UI/UX** - Beautiful gradient design with glass morphism effects
- 💬 **Real-time Chat** - Smooth messaging experience with animations
- 🌊 **Streaming Support** - Real-time response streaming for natural conversation flow
- ⚙️ **Customizable Settings** - Adjustable temperature, max tokens, and streaming options
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🔄 **Connection Status** - Real-time backend connectivity indicator
- 🎯 **TypeScript** - Full type safety throughout the application

### Backend (Node.js Express)
- 🧠 **OpenAI Integration** - GPT-4o-mini model for intelligent responses
- 🚀 **Modern ES Modules** - Clean, modern JavaScript syntax
- 🔒 **Security Features** - Rate limiting, CORS, Helmet security headers
- 📊 **Conversation History** - Maintains context across messages
- 🌊 **Streaming API** - Server-sent events for real-time responses
- 🏥 **Health Checks** - Multiple endpoints for system monitoring
- ⚡ **Performance** - Optimized for speed and reliability

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Add your OpenAI API key to `.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install additional UI dependencies:**
   ```bash
   npm install lucide-react
   ```

4. **Start the React application:**
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:3000`

## 🛠️ Project Structure

```
AI Chat/
├── backend/                    # Node.js Express API
│   ├── index.js               # Main server file
│   ├── routes/
│   │   └── chat.js           # Chat API routes
│   ├── services/
│   │   └── openai.js         # OpenAI service
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Environment template
│   └── README.md             # Backend documentation
│
└── client/                    # React TypeScript frontend
    ├── src/
    │   ├── components/
    │   │   ├── Chat.tsx      # Main chat component
    │   │   ├── Chat.css      # Chat styling
    │   │   ├── Message.tsx   # Message component
    │   │   └── Message.css   # Message styling
    │   ├── services/
    │   │   └── chatAPI.ts    # API service
    │   ├── types/
    │   │   └── chat.ts       # TypeScript types
    │   ├── App.tsx           # Main app component
    │   └── App.css           # Global styles
    ├── package.json          # Frontend dependencies
    └── .env                  # Environment config
```

## 🔧 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send message and get response
- `POST /api/chat/stream` - Send message with streaming response
- `GET /api/chat/models` - Get available models
- `GET /api/chat/health` - Chat service health check

### System Endpoints
- `GET /health` - General API health check

## 💡 Usage Examples

### Basic Chat Request
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Can you help me with React development?"
  }'
```

### Chat with History
```javascript
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Can you explain more about hooks?',
    conversationHistory: [
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'React is a JavaScript library...' }
    ],
    options: {
      maxTokens: 1000,
      temperature: 0.7
    }
  })
});
```

## 🎨 UI Features

### Chat Interface
- **Welcome Screen** - Helpful introduction with example prompts
- **Message Bubbles** - Distinct styling for user and AI messages
- **Typing Indicators** - Animated dots while AI is responding
- **Timestamps** - Clear message timing
- **Auto-scroll** - Automatic scrolling to latest messages

### Settings Panel
- **Streaming Toggle** - Enable/disable real-time streaming
- **Temperature Control** - Adjust AI creativity (0-1)
- **Token Limit** - Control response length (100-2000)
- **Connection Status** - Visual indicator of backend connectivity

### Responsive Design
- **Mobile Optimized** - Perfect experience on all screen sizes
- **Touch Friendly** - Large touch targets for mobile interaction
- **Adaptive Layout** - Intelligent layout adjustment

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Secure cross-origin requests
- **Input Validation** - Sanitizes all user inputs
- **Error Handling** - Graceful error management
- **Environment Variables** - Secure configuration management

## 🚀 Performance Optimizations

- **Streaming Responses** - Reduces perceived latency
- **Message Caching** - Efficient conversation history
- **Debounced Input** - Optimized typing experience
- **Lazy Loading** - Components load as needed
- **CSS Animations** - Hardware-accelerated transitions

## 🎯 Technologies Used

### Frontend
- **React 19.2** - Modern React with latest features
- **TypeScript** - Type-safe development
- **CSS3** - Advanced styling with gradients and animations
- **Fetch API** - Modern HTTP client
- **CSS Grid/Flexbox** - Responsive layouts

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **OpenAI API** - GPT-4o-mini integration
- **ES Modules** - Modern JavaScript modules
- **dotenv** - Environment management

## 🔧 Customization

### Styling
- Modify color schemes in CSS files
- Adjust gradients and glass morphism effects
- Customize animations and transitions

### API Configuration
- Change OpenAI model in `services/openai.js`
- Adjust rate limiting in `index.js`
- Modify CORS settings for production

### Features
- Add conversation persistence
- Implement user authentication
- Add file upload capabilities
- Integrate additional AI models

## 🚀 Deployment

### Frontend Deployment
```bash
cd client
npm run build
# Deploy the build folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Deploy to your Node.js hosting service
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Update CORS origins
- Configure production database if needed
- Set secure API keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:

1. Check the backend is running on port 3001
2. Verify your OpenAI API key is valid
3. Ensure all dependencies are installed
4. Check browser console for frontend errors
5. Review backend logs for API errors

## 🎉 Get Started

1. Clone the repository
2. Follow the setup instructions above
3. Start chatting with your AI assistant!

Enjoy building with your new AI Chat application! 🚀