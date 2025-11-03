import { BaseRepository } from '../utils/BaseRepository.js';
interface DocumentData {
    name: string;
    title?: string;
    content: string;
    source?: string;
    mimeType?: string;
    fileSize?: number;
    [key: string]: any;
}
interface Document extends DocumentData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
interface DocumentChunk {
    id: string;
    documentId: string;
    text: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    createdAt: Date;
}
interface VectorData {
    chunkId: string;
    documentId: string;
    embedding: number[];
    text: string;
    createdAt: Date;
}
interface SearchResult extends VectorData {
    similarity: number;
}
interface StorageStats {
    documentsCount: number;
    chunksCount: number;
    totalVectors: number;
}
/**
 * Repository for managing RAG documents and vector storage
 */
export declare class RagRepository extends BaseRepository<Document> {
    private documents;
    private vectors;
    private documentChunks;
    constructor();
    /**
     * Save document with metadata
     */
    saveDocument(documentData: DocumentData): Promise<Document>;
    /**
     * Get document by ID
     */
    getDocument(documentId: string): Promise<Document | null>;
    /**
     * Get all documents
     */
    getAllDocuments(): Promise<Document[]>;
    /**
     * Store document chunks with embeddings
     */
    storeChunks(documentId: string, chunks: Array<Omit<DocumentChunk, 'id' | 'documentId' | 'createdAt'>>): Promise<DocumentChunk[]>;
    /**
     * Get chunks for a document
     */
    getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
    /**
     * Store vector embeddings
     */
    storeVectors(documentChunks: DocumentChunk[]): Promise<boolean>;
    /**
     * Search vectors by similarity (simplified implementation)
     */
    searchVectors(queryEmbedding: number[], topK?: number, minSimilarity?: number): Promise<SearchResult[]>;
    /**
     * Calculate cosine similarity between two vectors
     */
    private calculateCosineSimilarity;
    /**
     * Delete document and all related data
     */
    deleteDocument(documentId: string): Promise<boolean>;
    /**
     * Clear all documents and vectors
     */
    clearAll(): Promise<boolean>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<StorageStats>;
    /**
     * Search documents by metadata
     */
    searchDocuments(query?: string): Promise<Document[]>;
}
export {};
