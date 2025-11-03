export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversationId?: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  conversationId?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  };
}

export interface StreamResponse {
  content: string;
  done: boolean;
  fullResponse?: string;
  error?: string;
}

export interface ChatError {
  error: string;
  message: string;
}

export interface ChatOptions {
  enableStreaming?: boolean;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  searchMode?: 'openai' | 'rag';
}

export interface ConversationHistory {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  title?: string;
}

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