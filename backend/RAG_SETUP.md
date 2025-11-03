# RAG (Retrieval-Augmented Generation) Implementation

## 🚀 Features

### Document Loading
- **Google Drive Integration** - Load Google Docs directly from your Drive
- **Text Upload** - Upload documents via API
- **Automatic Processing** - Split documents into chunks with overlap for better context

### Vector Search
- **OpenAI Embeddings** - Uses `text-embedding-3-small` for cost-effective embeddings
- **In-Memory Storage** - Fast similarity search without external dependencies
- **Similarity Threshold** - Configurable minimum similarity for results

### Query Processing
- **Context-Aware Answers** - Combines retrieved information with GPT-4o-mini
- **Source Attribution** - Shows which documents were used for answers
- **Flexible Filtering** - Search within specific documents or across all

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd backend
npm install googleapis pdf-parse mammoth cheerio uuid
```

### 2. Google Drive Setup (Optional)

#### Option A: Service Account (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API and Google Docs API
4. Create a Service Account
5. Download the JSON key file
6. Add to your `.env`:
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
```

#### Option B: Credentials File
1. Place your credentials file in the backend folder
2. Add to your `.env`:
```env
GOOGLE_CREDENTIALS_PATH=./credentials.json
```

### 3. Environment Variables
Add to your `.env` file:
```env
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional - Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json
# OR
GOOGLE_CREDENTIALS_PATH=./path/to/credentials.json
```

## 📚 API Endpoints

### Load Documents

#### From Google Drive
```bash
POST /api/rag/load-from-drive
Content-Type: application/json

{
  "documentIds": ["doc1_id", "doc2_id"],     # Optional: specific documents
  "folderId": "folder_id",                   # Optional: load from folder
  "maxDocs": 50                              # Optional: limit number of docs
}
```

#### From Text
```bash
POST /api/rag/load-from-text
Content-Type: application/json

{
  "documents": [
    {
      "id": "doc1",
      "title": "My Document",
      "content": "Document content here...",
      "fileName": "document.txt"
    }
  ]
}
```

### Query Documents
```bash
POST /api/rag/query
Content-Type: application/json

{
  "query": "What is the main topic discussed?",
  "options": {
    "topK": 5,                    # Number of chunks to retrieve
    "minSimilarity": 0.7,         # Minimum similarity threshold
    "maxContextLength": 4000,     # Max context length for GPT
    "temperature": 0.7,           # GPT temperature
    "maxTokens": 1000            # Max response tokens
  }
}
```

### Manage Documents
```bash
# Get loaded documents
GET /api/rag/documents

# Remove specific document
DELETE /api/rag/documents/:documentId

# Clear all documents
DELETE /api/rag/documents

# Search within document
POST /api/rag/search/:documentId
{
  "query": "search term",
  "topK": 3
}

# Get service status
GET /api/rag/status
```

## 💡 Usage Examples

### 1. Load Documents from Google Drive
```javascript
// Load all documents from a specific folder
const response = await fetch('/api/rag/load-from-drive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    folderId: 'your_google_drive_folder_id',
    maxDocs: 20
  })
});

console.log(await response.json());
```

### 2. Load Documents from Text
```javascript
const documents = [
  {
    id: 'company-policies',
    title: 'Company Policies 2024',
    content: 'Our company policies include...',
    fileName: 'policies.txt'
  },
  {
    id: 'employee-handbook',
    title: 'Employee Handbook',
    content: 'Welcome to the company...',
    fileName: 'handbook.txt'
  }
];

const response = await fetch('/api/rag/load-from-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ documents })
});
```

### 3. Query Your Documents
```javascript
const response = await fetch('/api/rag/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is our vacation policy?',
    options: {
      topK: 3,
      minSimilarity: 0.75
    }
  })
});

const result = await response.json();
console.log('Answer:', result.answer);
console.log('Sources:', result.sources);
```

## 🎯 Integration with Chat

You can enhance your existing chat to use RAG by modifying the chat routes to include document context:

```javascript
// In your chat route
if (ragEnabled && query.includes('@docs')) {
  // Use RAG for document-based queries
  const ragResult = await ragService.queryDocuments(query);
  return res.json({
    success: true,
    response: ragResult.answer,
    sources: ragResult.sources,
    type: 'rag'
  });
} else {
  // Use regular chat
  const response = await openaiService.generateResponse(query);
  return res.json({
    success: true,
    response: response,
    type: 'chat'
  });
}
```

## 🔧 Configuration Options

### Document Processing
- **Chunk Size**: Default 1000 characters
- **Overlap**: Default 200 characters for context preservation
- **Embedding Model**: `text-embedding-3-small` (cost-effective)

### Search Parameters
- **Top K**: Number of relevant chunks to retrieve (default: 5)
- **Min Similarity**: Minimum cosine similarity threshold (default: 0.7)
- **Max Context**: Maximum context length for GPT (default: 4000 chars)

### Performance Considerations
- **Batch Processing**: Embeddings are generated in batches to respect rate limits
- **In-Memory Storage**: Fast retrieval but limited by server memory
- **Rate Limiting**: Built-in delays between API calls

## 🚨 Troubleshooting

### Common Issues

1. **Google Drive Authentication**
   - Ensure APIs are enabled in Google Cloud Console
   - Check service account permissions
   - Verify JSON key format

2. **OpenAI Embeddings**
   - Check API key validity
   - Monitor rate limits
   - Ensure sufficient credits

3. **Memory Usage**
   - Monitor memory with large document sets
   - Consider implementing disk-based storage for production

4. **Search Quality**
   - Adjust similarity thresholds
   - Experiment with chunk sizes
   - Use better document preprocessing

## 📊 Monitoring

Check RAG service status:
```bash
curl http://localhost:3001/api/rag/status
```

This will show:
- Documents loaded
- Total chunks in vector store
- Embedding model used
- Google Drive integration status

## 🎉 Next Steps

1. **Install dependencies**: `npm install googleapis pdf-parse mammoth cheerio uuid`
2. **Configure Google Drive** (optional)
3. **Load your documents**
4. **Start querying!**

Your RAG system is now ready to provide intelligent, document-based responses! 🚀