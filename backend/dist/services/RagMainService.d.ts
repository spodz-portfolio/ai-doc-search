import { BaseService } from '../utils/BaseService.js';
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
    category?: string;
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
export declare class RagService extends BaseService {
    private documentProcessorService;
    private vectorStoreService;
    private chatService;
    isInitialized: boolean;
    private loadedDocuments;
    constructor(ragRepository?: RagRepository);
    /**
     * Initialize all services
     */
    initialize(): Promise<boolean>;
    /**
     * Load documents from Google Drive
     */
    loadDocumentsFromDrive(options?: LoadDocumentsOptions): Promise<RagResult>;
    /**
     * Load documents from text content
     */
    loadDocumentsFromText(textDocuments: Array<{
        title: string;
        content: string;
    }>): Promise<RagResult>;
    /**
     * Query the RAG system with a question
     */
    query(question: string, options?: QueryOptions): Promise<RagResult>;
    /**
     * Get RAG system status
     */
    getStatus(): Promise<{
        initialized: boolean;
        documentsLoaded: number;
        vectorStoreStats: any;
        lastActivity?: Date;
    }>;
    /**
     * Get loaded documents
     */
    getLoadedDocuments(): any[];
    /**
     * Remove a document from the RAG system
     */
    removeDocument(documentId: string): Promise<boolean>;
    /**
     * Clear all documents from the RAG system
     */
    clearAllDocuments(): Promise<boolean>;
    /**
     * Search documents by title or content
     */
    searchDocuments(query: string): Promise<any[]>;
}
export {};
