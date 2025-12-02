import { BaseRepository } from '../utils/BaseRepository.js';
/**
 * Repository for managing RAG documents and vector storage
 */
export class RagRepository extends BaseRepository {
    documents;
    vectors;
    documentChunks;
    constructor() {
        super();
        this.documents = new Map();
        this.vectors = new Map();
        this.documentChunks = new Map();
    }
    /**
     * Save document with metadata
     */
    async saveDocument(documentData) {
        const document = {
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
    async getDocument(documentId) {
        return this.documents.get(documentId) || null;
    }
    /**
     * Get all documents
     */
    async getAllDocuments() {
        return Array.from(this.documents.values());
    }
    /**
     * Store document chunks with embeddings
     */
    async storeChunks(documentId, chunks) {
        const chunkRecords = chunks.map(chunk => ({
            id: this.generateId(),
            documentId,
            ...chunk,
            createdAt: new Date()
        }));
        // Store chunks
        if (!this.documentChunks.has(documentId)) {
            this.documentChunks.set(documentId, []);
        }
        this.documentChunks.get(documentId).push(...chunkRecords);
        return chunkRecords;
    }
    /**
     * Get chunks for a document
     */
    async getDocumentChunks(documentId) {
        return this.documentChunks.get(documentId) || [];
    }
    /**
     * Store vector embeddings
     */
    async storeVectors(documentChunks) {
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
    async searchVectors(queryEmbedding, topK = 5, minSimilarity = 0.1) {
        const results = [];
        const allSimilarities = [];
        console.log(`🔍 Searching ${this.vectors.size} vectors with minSimilarity: ${minSimilarity}`);
        for (const [chunkId, vectorData] of this.vectors.entries()) {
            const similarity = this.calculateCosineSimilarity(queryEmbedding, vectorData.embedding);
            allSimilarities.push(similarity);
            console.log(`📊 Chunk ${chunkId.substring(0, 8)}: similarity = ${similarity.toFixed(4)} (text preview: "${vectorData.text.substring(0, 50)}...")`);
            if (similarity >= minSimilarity) {
                results.push({
                    ...vectorData,
                    similarity
                });
            }
        }
        console.log(`📊 Similarity stats: min=${Math.min(...allSimilarities).toFixed(4)}, max=${Math.max(...allSimilarities).toFixed(4)}, avg=${(allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length).toFixed(4)}`);
        console.log(`✅ Found ${results.length} chunks above threshold ${minSimilarity}`);
        // Sort by similarity (descending) and return top K
        const finalResults = results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
        console.log(`🎯 Returning top ${finalResults.length} results`);
        return finalResults;
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    calculateCosineSimilarity(vecA, vecB) {
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
    async deleteDocument(documentId) {
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
    async clearAll() {
        this.documents.clear();
        this.vectors.clear();
        this.documentChunks.clear();
        return true;
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        return {
            documentsCount: this.documents.size,
            chunksCount: this.vectors.size,
            totalVectors: this.vectors.size
        };
    }
    /**
     * Search documents by metadata
     */
    async searchDocuments(query) {
        const documents = Array.from(this.documents.values());
        if (!query) {
            return documents;
        }
        const queryLower = query.toLowerCase();
        return documents.filter(doc => (doc.name && doc.name.toLowerCase().includes(queryLower)) ||
            (doc.title && doc.title.toLowerCase().includes(queryLower)) ||
            (doc.content && doc.content.toLowerCase().includes(queryLower)));
    }
}
