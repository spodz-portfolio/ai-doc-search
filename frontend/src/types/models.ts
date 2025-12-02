import { IMessage, IRagMessage, ISource } from './interfaces';

export class Message implements IMessage {
  constructor(
    public id: string,
    public role: 'user' | 'assistant' | 'system',
    public content: string,
    public timestamp: Date = new Date(),
    public isLoading: boolean = false
  ) {}

  static create(role: 'user' | 'assistant' | 'system', content: string, id?: string): Message {
    return new Message(
      id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content
    );
  }

  isUser(): boolean {
    return this.role === 'user';
  }

  isAssistant(): boolean {
    return this.role === 'assistant';
  }

  setLoading(loading: boolean): Message {
    this.isLoading = loading;
    return this;
  }
}

export class RagMessage extends Message implements IRagMessage {
  constructor(
    id: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    timestamp: Date = new Date(),
    isLoading: boolean = false,
    public sources: ISource[] = [],
    public retrievedChunks: number = 0
  ) {
    super(id, role, content, timestamp, isLoading);
  }

  static createFromResponse(response: any, messageId?: string): RagMessage {
    return new RagMessage(
      messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      'assistant',
      response.success 
        ? response.data?.answer || response.answer || 'No answer found in documents.'
        : response.message || 'RAG search failed.',
      new Date(),
      false,
      response.data?.sources || response.sources || [],
      response.data?.retrievedChunks || response.retrievedChunks || 0
    );
  }

  hasSources(): boolean {
    return this.sources.length > 0;
  }
}

// ChatOptions removed - only RAG search is supported now