import { ChatRequest, ChatResponse } from '../types/chat';
import { IRagService } from '../types/interfaces';
import { BaseAPIService } from './baseAPIService';

export interface RagRequest {
  query: string;
  topK?: number;
  minSimilarity?: number;
  includeContext?: boolean;
  maxContextLength?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface RagResponse {
  success: boolean;
  message?: string;
  data?: {
    answer?: string;
    sources?: Array<{
      documentId: string;
      documentTitle: string;
      chunkIndex: number;
      similarity: number;
      webViewLink?: string;
      preview: string;
    }>;
    query: string;
    retrievedChunks?: number;
    contextLength?: number;
  };
  // Legacy fields for backward compatibility
  answer?: string;
  sources?: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    similarity: number;
    webViewLink?: string;
    preview: string;
  }>;
  query?: string;
  retrievedChunks?: number;
  contextLength?: number;
}

export interface DocumentLoadRequest {
  documents: Array<{
    id?: string;
    title?: string;
    fileName?: string;
    content: string;
    lastModified?: string;
  }>;
}

export interface DocumentLoadResponse {
  success: boolean;
  message: string;
  documents: Array<{
    id: string;
    title: string;
    fileName: string;
    chunkCount: number;
  }>;
}

export interface RagStatusResponse {
  status: {
    initialized: boolean;
    googleDriveEnabled: boolean;
    documentsLoaded: number;
    totalChunks: number;
    embeddingModel: string;
  };
}

class RagAPI extends BaseAPIService implements IRagService {
  constructor(baseUrl?: string) {
    super(baseUrl);
    console.log('🌐 RagAPI initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Initialize RAG system
   */
  async initialize(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing RAG:', error);
      throw error;
    }
  }

  /**
   * Query documents using RAG
   */
  async queryDocuments(request: RagRequest): Promise<RagResponse> {
    try {
      const url = `${this.baseUrl}/api/rag/query`;
      console.log('🔍 Sending RAG query to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 RAG Response status:', response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ RAG Error response body:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

      const data: RagResponse = await response.json();
      console.log('✅ RAG Response received:', data.success ? 'Success' : 'No results');
      return data;
    } catch (error) {
      console.error('Error querying RAG documents:', error);
      throw error;
    }
  }

  /**
   * Load documents from text content
   */
  async loadDocuments(request: DocumentLoadRequest): Promise<DocumentLoadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/load/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }

  /**
   * Load documents from Google Drive
   */
  async loadFromGoogleDrive(request: {
    folderId?: string;
    documentIds?: string[];
    maxDocs?: number;
  }): Promise<DocumentLoadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/load/drive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading documents from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Load all Google Docs from your account (not just from specific folders)
   */
  async loadFromGoogleDocs(request: {
    maxDocs?: number;
    searchQuery?: string;
    includeShared?: boolean;
  } = {}): Promise<DocumentLoadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/load/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading Google Docs:', error);
      throw error;
    }
  }

  /**
   * Search and load specific Google Docs by name/content
   */
  async searchAndLoadGoogleDocs(request: {
    searchQuery: string;
    maxDocs?: number;
  }): Promise<DocumentLoadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/search/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching Google Docs:', error);
      throw error;
    }
  }

  /**
   * Get RAG system status
   */
  async getStatus(): Promise<RagStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting RAG status:', error);
      throw error;
    }
  }

  /**
   * Get loaded documents
   */
  async getDocuments(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/documents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Upload documents from files
   */
  async uploadDocuments(files: FileList): Promise<DocumentLoadResponse> {
    try {
      const formData = new FormData();
      
      // Add all files to FormData
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
      }

      const response = await fetch(`${this.baseUrl}/api/rag/load/upload`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header, let browser set it
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  /**
   * Get supported file formats
   */
  async getSupportedFormats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/upload/formats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supported formats:', error);
      throw error;
    }
  }

  /**
   * RAG Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in RAG health check:', error);
      throw error;
    }
  }
}

export const ragAPI = new RagAPI();
export default ragAPI;