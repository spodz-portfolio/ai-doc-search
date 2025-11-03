import { BaseService } from '../utils/BaseService.js';
// import { GoogleDriveService } from './GoogleDriveService.js';
import { DocumentProcessorService } from './DocumentProcessorService.js';
import { VectorStoreService } from './VectorStoreService.js';
import { ChatService } from './ChatService.js';
import type { RagRepository } from '../repositories/RagRepository.js';

interface LoadDocumentsOptions {
  documentIds?: string[];
  folderId?: string;
  maxDocs?: number;
}

interface QueryOptions {
  topK?: number;
  minSimilarity?: number;
  includeContext?: boolean;
  maxContextLength?: number;
}

interface RagResult {
  success: boolean;
  message?: string;
  documents?: any[];
  chunks?: any[];
  answer?: string;
  sources?: any[];
  context?: string;
}

/**
 * Service for orchestrating Retrieval-Augmented Generation (RAG) operations
 */
export class RagService extends BaseService {
  // private googleDriveService: GoogleDriveService;
  private documentProcessorService: DocumentProcessorService;
  private vectorStoreService: VectorStoreService;
  private chatService: ChatService;
  public isInitialized: boolean;
  private loadedDocuments: Map<string, any>;

  constructor(ragRepository?: RagRepository) {
    super(ragRepository);
    
    // Initialize dependent services
    // TODO: Uncomment after GoogleDriveService is converted to TypeScript
    // this.googleDriveService = new GoogleDriveService(ragRepository);
    this.documentProcessorService = new DocumentProcessorService(ragRepository);
    this.vectorStoreService = new VectorStoreService(ragRepository);
    this.chatService = new ChatService(); // RAG doesn't need chat repository
    
    this.isInitialized = false;
    this.loadedDocuments = new Map();
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing RAG Service...');
      
      // Initialize Google Drive (optional - only if credentials are available)
      // TODO: Uncomment after GoogleDriveService is converted
      // try {
      //   await this.googleDriveService.initialize();
      //   console.log('✅ Google Drive integration enabled');
      // } catch (error) {
      //   console.warn('⚠️ Google Drive integration disabled:', (error as Error).message);
      // }

      console.warn('⚠️ Google Drive integration not available in TypeScript conversion yet');

      this.isInitialized = true;
      console.log('✅ RAG Service initialized successfully');
      return true;
    } catch (error) {
      this.handleError(error as Error, 'RAG Service initialization');
    }
  }

  /**
   * Load documents from Google Drive
   */
  async loadDocumentsFromDrive(options: LoadDocumentsOptions = {}): Promise<RagResult> {
    const { documentIds, folderId, maxDocs = 50 } = options;

    try {
      // Auto-initialize RAG system if not already initialized
      if (!this.isInitialized) {
        console.log('🚀 Auto-initializing RAG system for document loading...');
        await this.initialize();
      }

      console.log('📄 Loading documents from Google Drive...');
      
      // TODO: Implement after GoogleDriveService is converted
      console.warn('⚠️ Google Drive document loading not yet implemented in TypeScript conversion');
      
      return { 
        success: false, 
        message: 'Google Drive integration not yet available in TypeScript conversion',
        documents: [] 
      };
    } catch (error) {
      console.error('❌ Error loading documents from Google Drive:', error);
      this.handleError(error as Error, 'Google Drive document loading');
    }
  }

  /**
   * Load documents from text content
   */
  async loadDocumentsFromText(textDocuments: Array<{ title: string; content: string }>): Promise<RagResult> {
    try {
      // Auto-initialize RAG system if not already initialized
      if (!this.isInitialized) {
        console.log('🚀 Auto-initializing RAG system for text loading...');
        await this.initialize();
      }

      console.log(`📄 Loading ${textDocuments.length} text documents...`);
      
      // Convert text documents to document format
      const documents = textDocuments.map((doc, index) => ({
        id: `text-doc-${Date.now()}-${index}`,
        title: doc.title,
        content: doc.content,
        source: 'text_input'
      }));

      // Process documents into chunks
      const chunks = await this.documentProcessorService.processDocuments(documents);
      
      if (chunks.length === 0) {
        return { success: false, message: 'No content found in documents', documents: [] };
      }

      // Add chunks to vector store
      const vectorChunks = chunks.map(chunk => ({
        ...chunk,
        documentId: chunk.metadata.documentId,
        createdAt: new Date()
      }));
      await this.vectorStoreService.addChunks(vectorChunks);

      // Store document metadata
      for (const doc of documents) {
        this.loadedDocuments.set(doc.id, {
          ...doc,
          chunksCount: chunks.filter(c => c.metadata.documentId === doc.id).length,
          loadedAt: new Date()
        });

        // Save to repository if available
        if (this.repository) {
          await (this.repository as RagRepository).saveDocument({
            name: doc.title,
            content: doc.content,
            source: doc.source
          });
        }
      }

      console.log(`✅ Successfully loaded ${documents.length} documents with ${chunks.length} chunks`);
      
      return {
        success: true,
        message: `Loaded ${documents.length} documents successfully`,
        documents: documents,
        chunks: chunks
      };
    } catch (error) {
      console.error('❌ Error loading text documents:', error);
      this.handleError(error as Error, 'Text document loading');
    }
  }

  /**
   * Query the RAG system with a question
   */
  async query(question: string, options: QueryOptions = {}): Promise<RagResult> {
    try {
      const {
        topK = 5,
        minSimilarity = 0.7,
        includeContext = true,
        maxContextLength = 4000
      } = options;

      // Auto-initialize RAG system if not already initialized
      if (!this.isInitialized) {
        console.log('🚀 Auto-initializing RAG system for query...');
        await this.initialize();
      }

      console.log(`🔍 Querying RAG system: "${question}"`);

      // Search for relevant chunks
      const relevantChunks = await this.vectorStoreService.similaritySearch(
        question,
        topK,
        minSimilarity
      );

      if (relevantChunks.length === 0) {
        console.log('❌ No relevant documents found');
        return {
          success: false,
          message: 'No relevant information found for your query',
          sources: []
        };
      }

      console.log(`📚 Found ${relevantChunks.length} relevant chunks`);

      // Build context from relevant chunks
      let context = '';
      const sources: any[] = [];

      for (const chunk of relevantChunks) {
        if (context.length + chunk.text.length <= maxContextLength) {
          context += `${chunk.text}\n\n`;
          sources.push({
            documentId: chunk.documentId,
            chunkId: chunk.chunkId,
            similarity: chunk.similarity,
            text: chunk.text.substring(0, 200) + '...',
            metadata: chunk.metadata || {}
          });
        }
      }

      if (!includeContext) {
        // Just return the sources without generating an answer
        return {
          success: true,
          message: `Found ${relevantChunks.length} relevant sources`,
          sources,
          context
        };
      }

      // Generate response using chat service with context
      const systemPrompt = `You are a helpful AI assistant. Use the following context to answer the user's question. If the context doesn't contain enough information to answer the question, say so clearly.

Context:
${context}

Please provide a comprehensive answer based on the context above.`;

      const answer = await this.chatService.generateResponse(
        question,
        [],
        { systemPrompt }
      );

      console.log('✅ Generated RAG response');

      return {
        success: true,
        message: 'Query completed successfully',
        answer,
        sources,
        context: includeContext ? context : undefined
      };

    } catch (error) {
      console.error('❌ Error in RAG query:', error);
      this.handleError(error as Error, 'RAG query');
    }
  }

  /**
   * Get RAG system status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    documentsLoaded: number;
    vectorStoreStats: any;
    lastActivity?: Date;
  }> {
    try {
      const vectorStoreStats = await this.vectorStoreService.getStats();
      
      return {
        initialized: this.isInitialized,
        documentsLoaded: this.loadedDocuments.size,
        vectorStoreStats,
        lastActivity: new Date()
      };
    } catch (error) {
      console.error('Error getting RAG status:', error);
      return {
        initialized: false,
        documentsLoaded: 0,
        vectorStoreStats: {}
      };
    }
  }

  /**
   * Get loaded documents
   */
  getLoadedDocuments(): any[] {
    return Array.from(this.loadedDocuments.values());
  }

  /**
   * Remove a document from the RAG system
   */
  async removeDocument(documentId: string): Promise<boolean> {
    try {
      // Remove from vector store
      await this.vectorStoreService.removeDocument(documentId);
      
      // Remove from loaded documents
      this.loadedDocuments.delete(documentId);
      
      // Remove from repository if available
      if (this.repository) {
        await (this.repository as RagRepository).deleteDocument(documentId);
      }

      console.log(`🗑️ Removed document ${documentId} from RAG system`);
      return true;
    } catch (error) {
      console.error(`Error removing document ${documentId}:`, error);
      return false;
    }
  }

  /**
   * Clear all documents from the RAG system
   */
  async clearAllDocuments(): Promise<boolean> {
    try {
      // Clear vector store
      await this.vectorStoreService.clear();
      
      // Clear loaded documents
      this.loadedDocuments.clear();
      
      // Clear repository if available
      if (this.repository) {
        await (this.repository as RagRepository).clearAll();
      }

      console.log('🗑️ Cleared all documents from RAG system');
      return true;
    } catch (error) {
      console.error('Error clearing all documents:', error);
      return false;
    }
  }

  /**
   * Search documents by title or content
   */
  async searchDocuments(query: string): Promise<any[]> {
    try {
      if (this.repository) {
        return await (this.repository as RagRepository).searchDocuments(query);
      }
      
      // Fallback: search in loaded documents
      const results: any[] = [];
      const queryLower = query.toLowerCase();
      
      for (const doc of this.loadedDocuments.values()) {
        if (doc.title?.toLowerCase().includes(queryLower) ||
            doc.content?.toLowerCase().includes(queryLower)) {
          results.push(doc);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}