import { ChatRequest, ChatResponse, StreamResponse } from '../types/chat';
import { IChatService } from '../types/interfaces';
import { BaseAPIService } from './baseAPIService';

class ChatAPI extends BaseAPIService implements IChatService {
  constructor(baseUrl?: string) {
    super(baseUrl);
    console.log('🌐 ChatAPI initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Send a chat message and get a response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    console.log('🔍 Sending chat request');
    return this.makeRequest<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Send a chat message with streaming response
   */
  async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: StreamResponse) => void
  ): Promise<void> {
    return this.makeStreamRequest('/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify(request),
    }, onChunk);
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any> {
    return this.makeRequest('/api/chat/models');
  }

  /**
   * Health check for the chat API
   */
  async healthCheck(): Promise<any> {
    return this.makeRequest('/api/chat/health');
  }

  /**
   * General health check
   */
  async generalHealthCheck(): Promise<any> {
    return this.makeRequest('/health');
  }
}

export const chatAPI = new ChatAPI();
export default chatAPI;