import { BaseService } from '../utils/BaseService.js';
import type { RagRepository } from '../repositories/RagRepository.js';
interface DocumentChunk {
    id: string;
    documentId: string;
    text: string;
    content?: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    createdAt: Date;
}
interface SearchResult {
    chunkId: string;
    documentId: string;
    text: string;
    similarity: number;
    embedding: number[];
    createdAt: Date;
    metadata?: Record<string, any>;
}
interface SearchFilters {
    documentId?: string;
    documentTitle?: string;
    minChunkSize?: number;
    category?: string;
}
interface VectorStoreStats {
    totalChunks: number | string;
    totalVectors: number;
    documentsCount: number;
    embeddingModel: string;
    embeddingDimension: number;
    documents: any[];
}
/**
 * Service for handling vector embeddings and similarity search
 */
export declare class VectorStoreService extends BaseService {
    private openai;
    private embeddingModel;
    private embeddingDimension;
    constructor(ragRepository?: RagRepository);
    /**
     * Generate embeddings for text using OpenAI
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts in batches
     */
    generateBatchEmbeddings(texts: string[], batchSize?: number): Promise<number[][]>;
    /**
     * Add chunks with embeddings to the vector store
     */
    addChunks(chunks: DocumentChunk[]): Promise<number>;
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number;
    /**
     * Search for similar chunks using vector similarity
     */
    similaritySearch(query: string, topK?: number, minSimilarity?: number): Promise<SearchResult[]>;
    /**
     * Get total number of chunks in the vector store
     */
    getTotalChunks(): Promise<number | string>;
    /**
     * Search with metadata filtering
     */
    searchWithFilter(query: string, topK?: number, filters?: SearchFilters, minSimilarity?: number): Promise<SearchResult[]>;
    /**
     * Get statistics about the vector store
     */
    getStats(): Promise<VectorStoreStats>;
    /**
     * Clear all vectors and chunks
     */
    clear(): Promise<boolean>;
    /**
     * Remove chunks by document ID
     */
    removeDocument(documentId: string): Promise<boolean>;
    /**
     * Get all chunks for a document
     */
    getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
    /**
     * Recompute embeddings for existing chunks
     */
    recomputeEmbeddings(documentId?: string): Promise<number>;
}
export {};
