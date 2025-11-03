import { BaseService } from '../utils/BaseService.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Service for handling vector embeddings and similarity search
 */
export class VectorStoreService extends BaseService {
    openai;
    embeddingModel;
    embeddingDimension;
    constructor(ragRepository) {
        super(ragRepository);
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.embeddingModel = 'text-embedding-3-small'; // More cost-effective than ada-002
        this.embeddingDimension = 1536;
    }
    /**
     * Generate embeddings for text using OpenAI
     */
    async generateEmbedding(text) {
        try {
            this.validateInput({ text }, ['text']);
            const response = await this.openai.embeddings.create({
                model: this.embeddingModel,
                input: text.slice(0, 8000), // Limit input size for embedding model
            });
            return response.data[0].embedding;
        }
        catch (error) {
            this.handleError(error, 'Embedding generation');
        }
    }
    /**
     * Generate embeddings for multiple texts in batches
     */
    async generateBatchEmbeddings(texts, batchSize = 10) {
        try {
            this.validateInput({ texts }, ['texts']);
            if (!Array.isArray(texts)) {
                throw new Error('Texts must be an array');
            }
            const embeddings = [];
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const promises = batch.map(text => this.generateEmbedding(text));
                const batchEmbeddings = await Promise.all(promises);
                embeddings.push(...batchEmbeddings);
                // Small delay between batches to respect rate limits
                if (i + batchSize < texts.length) {
                    await this.sleep(100);
                }
            }
            return embeddings;
        }
        catch (error) {
            this.handleError(error, 'Batch embedding generation');
        }
    }
    /**
     * Add chunks with embeddings to the vector store
     */
    async addChunks(chunks) {
        try {
            this.validateInput({ chunks }, ['chunks']);
            if (!Array.isArray(chunks)) {
                throw new Error('Chunks must be an array');
            }
            console.log(`🔄 Adding ${chunks.length} chunks to vector store...`);
            const batchSize = 10; // Process in batches to avoid rate limits
            let processed = 0;
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);
                await Promise.all(batch.map(async (chunk) => {
                    try {
                        // Ensure text field is properly set
                        const textContent = chunk.text || chunk.content || '';
                        if (!textContent) {
                            console.warn(`⚠️ Chunk ${chunk.id} has no text content, skipping`);
                            return;
                        }
                        const embedding = await this.generateEmbedding(textContent);
                        // Create a properly typed chunk for storage
                        const chunkForStorage = {
                            ...chunk,
                            text: textContent,
                            embedding: embedding,
                            createdAt: chunk.createdAt || new Date()
                        };
                        // Store in repository if available
                        if (this.repository) {
                            console.log(`📦 Storing chunk ${chunk.id} with embedding length: ${embedding.length}`);
                            await this.repository.storeVectors([chunkForStorage]);
                            console.log(`✅ Successfully stored chunk ${chunk.id}`);
                        }
                        else {
                            console.warn(`⚠️ No repository available - chunk ${chunk.id} not stored persistently`);
                        }
                        processed++;
                        if (processed % 50 === 0) {
                            console.log(`📊 Processed ${processed}/${chunks.length} chunks`);
                        }
                    }
                    catch (error) {
                        console.error(`Failed to process chunk ${chunk.id}:`, error);
                    }
                }));
                // Small delay between batches to respect rate limits
                if (i + batchSize < chunks.length) {
                    await this.sleep(100);
                }
            }
            console.log(`✅ Added ${processed} chunks to vector store`);
            return processed;
        }
        catch (error) {
            this.handleError(error, 'Adding chunks to vector store');
        }
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
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
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (normA * normB);
    }
    /**
     * Search for similar chunks using vector similarity
     */
    async similaritySearch(query, topK = 5, minSimilarity = 0.7) {
        try {
            this.validateInput({ query }, ['query']);
            console.log(`🔍 Searching for: "${query.slice(0, 100)}..."`);
            // Generate embedding for the query
            const queryEmbedding = await this.generateEmbedding(query);
            // Search using repository if available
            if (this.repository) {
                console.log(`🔍 Repository available, searching with embedding length: ${queryEmbedding.length}`);
                const results = await this.repository.searchVectors(queryEmbedding, topK, minSimilarity);
                console.log(`📋 Found ${results.length} relevant chunks (similarity >= ${minSimilarity})`);
                if (results.length === 0) {
                    console.log(`🔍 Debugging: Trying to search with no threshold to see if ANY vectors exist...`);
                    try {
                        const anyResults = await this.repository.searchVectors(queryEmbedding, 1, 0.0);
                        console.log(`🔍 Found ${anyResults.length} vectors with 0.0 threshold`);
                    }
                    catch (debugError) {
                        console.log(`❌ Debug search failed:`, debugError.message);
                    }
                }
                return results;
            }
            else {
                console.warn(`⚠️ No repository available for search`);
            }
            // Fallback to empty results if no repository
            return [];
        }
        catch (error) {
            this.handleError(error, 'Similarity search');
        }
    }
    /**
     * Get total number of chunks in the vector store
     */
    async getTotalChunks() {
        try {
            if (this.repository && this.repository.getTotalChunks) {
                return await this.repository.getTotalChunks();
            }
            // Fallback: try to estimate from search
            if (this.repository && this.repository.searchVectors) {
                // This is a workaround - we'll return "unknown" for now
                return "unknown";
            }
            return 0;
        }
        catch (error) {
            console.warn('Could not get total chunks count:', error.message);
            return 0;
        }
    }
    /**
     * Search with metadata filtering
     */
    async searchWithFilter(query, topK = 5, filters = {}, minSimilarity = 0.7) {
        try {
            // Get all results first
            const allResults = await this.similaritySearch(query, 100, minSimilarity);
            // Apply metadata filters
            let filteredResults = allResults;
            if (filters.documentId) {
                filteredResults = filteredResults.filter(chunk => chunk.documentId === filters.documentId);
            }
            if (filters.documentTitle) {
                const title = filters.documentTitle;
                filteredResults = filteredResults.filter(chunk => chunk.metadata &&
                    chunk.metadata.documentTitle &&
                    chunk.metadata.documentTitle.toLowerCase().includes(title.toLowerCase()));
            }
            if (filters.minChunkSize !== undefined) {
                const minSize = filters.minChunkSize;
                filteredResults = filteredResults.filter(chunk => chunk.metadata &&
                    chunk.metadata.chunkSize >= minSize);
            }
            return filteredResults.slice(0, topK);
        }
        catch (error) {
            this.handleError(error, 'Filtered search');
        }
    }
    /**
     * Get statistics about the vector store
     */
    async getStats() {
        try {
            console.log(`📊 Getting vector store stats...`);
            console.log(`📊 Repository available: ${!!this.repository}`);
            if (this.repository) {
                const stats = await this.repository.getStats();
                console.log(`📊 Repository stats:`, stats);
                return {
                    totalChunks: stats.chunksCount || stats.totalVectors || 0,
                    totalVectors: stats.totalVectors,
                    documentsCount: stats.documentsCount,
                    embeddingModel: this.embeddingModel,
                    embeddingDimension: this.embeddingDimension,
                    documents: []
                };
            }
            console.log(`📊 No repository - returning default stats`);
            return {
                totalChunks: 0,
                totalVectors: 0,
                documentsCount: 0,
                embeddingModel: this.embeddingModel,
                embeddingDimension: this.embeddingDimension,
                documents: []
            };
        }
        catch (error) {
            console.error(`❌ Error getting vector store stats:`, error);
            this.handleError(error, 'Getting vector store stats');
        }
    }
    /**
     * Clear all vectors and chunks
     */
    async clear() {
        try {
            if (this.repository) {
                await this.repository.clearAll();
            }
            console.log('🗑️ Vector store cleared');
            return true;
        }
        catch (error) {
            this.handleError(error, 'Clearing vector store');
        }
    }
    /**
     * Remove chunks by document ID
     */
    async removeDocument(documentId) {
        try {
            this.validateInput({ documentId }, ['documentId']);
            if (this.repository) {
                await this.repository.deleteDocument(documentId);
                console.log(`🗑️ Removed chunks for document ${documentId}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.handleError(error, `Removing document ${documentId}`);
        }
    }
    /**
     * Get all chunks for a document
     */
    async getDocumentChunks(documentId) {
        try {
            this.validateInput({ documentId }, ['documentId']);
            if (this.repository) {
                return await this.repository.getDocumentChunks(documentId);
            }
            return [];
        }
        catch (error) {
            this.handleError(error, `Getting chunks for document ${documentId}`);
        }
    }
    /**
     * Recompute embeddings for existing chunks
     */
    async recomputeEmbeddings(documentId) {
        try {
            if (!this.repository) {
                throw new Error('Repository required for recomputing embeddings');
            }
            let chunks = [];
            if (documentId) {
                chunks = await this.repository.getDocumentChunks(documentId);
            }
            else {
                // Get all chunks - this would need to be implemented in repository
                throw new Error('Recomputing all embeddings not implemented');
            }
            console.log(`🔄 Recomputing embeddings for ${chunks.length} chunks...`);
            return await this.addChunks(chunks);
        }
        catch (error) {
            this.handleError(error, 'Recomputing embeddings');
        }
    }
}
