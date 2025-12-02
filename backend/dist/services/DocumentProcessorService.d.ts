import { BaseService } from '../utils/BaseService.js';
import type { RagRepository } from '../repositories/RagRepository.js';
interface Document {
    id: string;
    content: string;
    title?: string;
    fileName?: string;
    webViewLink?: string;
    lastModified?: string;
}
interface DocumentChunk {
    id: string;
    text: string;
    content: string;
    documentId: string;
    metadata: {
        documentId: string;
        documentTitle: string;
        chunkIndex: number;
        totalChunks: number;
        webViewLink: string | null;
        lastModified: string | null;
        chunkSize: number;
    };
}
interface DocumentStats {
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    keyPhrases: string[];
}
/**
 * Service for processing documents into chunks for RAG
 */
export declare class DocumentProcessorService extends BaseService {
    private defaultChunkSize;
    private defaultOverlap;
    constructor(ragRepository?: RagRepository);
    /**
     * Calculate optimal chunk size based on document characteristics
     */
    private calculateOptimalChunkSize;
    /**
     * Split text into chunks with overlap for better context preservation
     */
    splitTextIntoChunks(text: string, chunkSize?: number, overlap?: number): string[];
    /**
     * Split text into sentences using multiple delimiters
     */
    splitIntoSentences(text: string): string[];
    /**
     * Get overlap text from the end of a chunk
     */
    getOverlapText(text: string, overlapSize: number): string;
    /**
     * Process a single document into chunks with metadata
     */
    processDocument(document: Document, chunkSize?: number, overlap?: number): Promise<DocumentChunk[]>;
    /**
     * Process multiple documents into chunks with parallel processing
     */
    processDocuments(documents: Document[], chunkSize?: number, overlap?: number): Promise<DocumentChunk[]>;
    /**
     * Process documents with controlled concurrency
     */
    private processDocumentsWithConcurrency;
    /**
     * Extract key phrases from text for better retrieval
     */
    extractKeyPhrases(text: string, maxPhrases?: number): string[];
    /**
     * Simple stop words list
     */
    isStopWord(word: string): boolean;
    /**
     * Clean and normalize text content
     */
    cleanText(text: string): string;
    /**
     * Get document statistics
     */
    getDocumentStats(document: Document): DocumentStats;
    /**
     * Reprocess document with new chunking parameters
     */
    reprocessDocument(documentId: string, chunkSize?: number, overlap?: number): Promise<DocumentChunk[]>;
}
export {};
