# AI Chatbot API

A Node.js/Express API that provides chatbot functionality using OpenAI's GPT-4o-mini model.

## Features

- 🤖 GPT-4o-mini integration for intelligent conversations
- 🔄 Conversation history management
- 🚀 Streaming responses for real-time chat experience
- 🔒 Security features (rate limiting, CORS, helmet)
- 📝 Input validation and error handling
- 🏥 Health check endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Chat Endpoints

#### POST `/api/chat`
Send a message to the chatbot and receive a response.

**Request Body:**
```json
{
  "message": "Hello, how can you help me?",
  "conversationHistory": [
    {"role": "user", "content": "Previous user message"},
    {"role": "assistant", "content": "Previous bot response"}
  ],
  "conversationId": "optional-conversation-id",
  "options": {
    "maxTokens": 1000,
    "temperature": 0.7,
    "systemPrompt": "Optional custom system prompt"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Hello! I'm here to help you with any questions or tasks you have...",
  "conversationId": "conversation-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### POST `/api/chat/stream`
Stream a chat response for real-time typing effect.

**Request Body:** Same as `/api/chat`

**Response:** Server-Sent Events stream with JSON data:
```json
{"content": "Hello", "done": false}
{"content": "! I'm", "done": false}
{"content": " here to help", "done": false}
{"content": "", "done": true, "fullResponse": "Hello! I'm here to help"}
```

#### GET `/api/chat/models`
Get information about available models.

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o Mini",
      "description": "Fast and efficient model for most conversational tasks",
      "maxTokens": 4096,
      "default": true
    }
  ],
  "defaultModel": "gpt-4o-mini"
}
```

### Health Check Endpoints

#### GET `/health`
General API health check.

#### GET `/api/chat/health`
Chat service health check.

## Request Validation

- `message`: Required, non-empty string (max 4000 characters)
- `conversationHistory`: Optional array of message objects with `role` and `content`
- `options`: Optional configuration object

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid API key)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (OpenAI API issues)

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitizes and validates requests
- **Error Handling**: Doesn't expose sensitive information

## Configuration

Environment variables in `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Usage Examples

### Basic Chat Request (cURL)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?"
  }'
```

### Chat with History (JavaScript)
```javascript
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Can you explain more about that?',
    conversationHistory: [
      { role: 'user', content: 'What is machine learning?' },
      { role: 'assistant', content: 'Machine learning is a subset of AI...' }
    ]
  })
});

const data = await response.json();
console.log(data.response);
```

### Streaming Response (JavaScript)
```javascript
const response = await fetch('http://localhost:3001/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Tell me a story'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        console.log(data.content); // Stream content
      }
      if (data.done) {
        console.log('Stream complete');
      }
    }
  }
}
```

## Development

### Project Structure
```
backend/
├── index.js              # Main server file
├── routes/
│   └── chat.js           # Chat API routes
├── services/
│   └── openai.js         # OpenAI service
├── package.json          # Dependencies and scripts
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## License

ISC