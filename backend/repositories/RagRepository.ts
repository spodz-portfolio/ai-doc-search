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
export class RagRepository extends BaseRepository<Document> {
  private documents: Map<string, Document>;
  private vectors: Map<string, VectorData>;
  private documentChunks: Map<string, DocumentChunk[]>;

  constructor() {
    super();
    this.documents = new Map();
    this.vectors = new Map();
    this.documentChunks = new Map();
  }

  /**
   * Save document with metadata
   */
  async saveDocument(documentData: DocumentData): Promise<Document> {
    const document: Document = {
      id: this.generateId(),
      ...documentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.documents.set(document.id, document);
    return document;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    return this.documents.get(documentId) || null;
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  /**
   * Store document chunks with embeddings
   */
  async storeChunks(documentId: string, chunks: Array<Omit<DocumentChunk, 'id' | 'documentId' | 'createdAt'>>): Promise<DocumentChunk[]> {
    const chunkRecords: DocumentChunk[] = chunks.map(chunk => ({
      id: this.generateId(),
      documentId,
      ...chunk,
      createdAt: new Date()
    }));

    // Store chunks
    if (!this.documentChunks.has(documentId)) {
      this.documentChunks.set(documentId, []);
    }
    this.documentChunks.get(documentId)!.push(...chunkRecords);

    return chunkRecords;
  }

  /**
   * Get chunks for a document
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return this.documentChunks.get(documentId) || [];
  }

  /**
   * Store vector embeddings
   */
  async storeVectors(documentChunks: DocumentChunk[]): Promise<boolean> {
    for (const chunk of documentChunks) {
      if (chunk.embedding) {
        this.vectors.set(chunk.id, {
          chunkId: chunk.id,
          documentId: chunk.documentId,
          embedding: chunk.embedding,
          text: chunk.text,
          createdAt: new Date()
        });
      }
    }
    return true;
  }

  /**
   * Search vectors by similarity (simplified implementation)
   */
  async searchVectors(queryEmbedding: number[], topK: number = 5, minSimilarity: number = 0.7): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const [chunkId, vectorData] of this.vectors.entries()) {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, vectorData.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({
          ...vectorData,
          similarity
        });
      }
    }

    // Sort by similarity (descending) and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Delete document and all related data
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    // Delete document metadata
    this.documents.delete(documentId);

    // Delete chunks
    const chunks = this.documentChunks.get(documentId) || [];
    this.documentChunks.delete(documentId);

    // Delete vectors
    for (const chunk of chunks) {
      this.vectors.delete(chunk.id);
    }

    return true;
  }

  /**
   * Clear all documents and vectors
   */
  async clearAll(): Promise<boolean> {
    this.documents.clear();
    this.vectors.clear();
    this.documentChunks.clear();
    return true;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    return {
      documentsCount: this.documents.size,
      chunksCount: this.vectors.size,
      totalVectors: this.vectors.size
    };
  }

  /**
   * Search documents by metadata
   */
  async searchDocuments(query?: string): Promise<Document[]> {
    const documents = Array.from(this.documents.values());
    
    if (!query) {
      return documents;
    }

    const queryLower = query.toLowerCase();
    return documents.filter(doc => 
      (doc.name && doc.name.toLowerCase().includes(queryLower)) ||
      (doc.title && doc.title.toLowerCase().includes(queryLower)) ||
      (doc.content && doc.content.toLowerCase().includes(queryLower))
    );
  }
}