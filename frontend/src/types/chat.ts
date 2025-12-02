export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// OpenAI chat-related interfaces removed - only RAG functionality supported now

export interface RagMessage extends ChatMessage {
  sources?: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    similarity: number;
    webViewLink?: string;
    preview: string;
  }>;
  retrievedChunks?: number;
}