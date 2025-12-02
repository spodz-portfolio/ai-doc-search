// Domain interfaces following Interface Segregation Principle

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ISource {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  similarity: number;
  webViewLink?: string;
  preview: string;
}

export interface IRagMessage extends IMessage {
  sources?: ISource[];
  retrievedChunks?: number;
}

// IChatOptions removed - only RAG search is supported now

export interface IRagStatus {
  initialized: boolean;
  documentsLoaded: number;
  totalChunks: number;
}

// Service interfaces - IChatService removed, only RAG service is supported

export interface IRagService {
  queryDocuments(request: any): Promise<any>;
  getStatus(): Promise<any>;
  initialize(): Promise<any>;
  uploadDocuments(files: FileList): Promise<any>;
  loadFromGoogleDocs(options: any): Promise<any>;
  loadFromGoogleDrive(options: any): Promise<any>;
}

export interface IMessageService {
  generateUniqueId(): string;
  formatMessage(content: string, sources?: ISource[]): string;
}

export interface IUIService {
  scrollToBottom(element: React.RefObject<HTMLElement>): void;
  adjustTextareaHeight(textarea: React.RefObject<HTMLTextAreaElement>): void;
}