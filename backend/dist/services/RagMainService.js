import { BaseService } from '../utils/BaseService.js';
// import { GoogleDriveService } from './GoogleDriveService.js';
import { DocumentProcessorService } from './DocumentProcessorService.js';
import { VectorStoreService } from './VectorStoreService.js';
import { ChatService } from './ChatService';
/**
 * Service for orchestrating Retrieval-Augmented Generation (RAG) operations
 */
export class RagService extends BaseService {
    // private googleDriveService: GoogleDriveService;
    documentProcessorService;
    vectorStoreService;
    chatService;
    isInitialized;
    loadedDocuments;
    constructor(ragRepository) {
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
    async initialize() {
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
        }
        catch (error) {
            this.handleError(error, 'RAG Service initialization');
        }
    }
    /**
     * Load documents from Google Drive
     */
    async loadDocumentsFromDrive(options = {}) {
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
        }
        catch (error) {
            console.error('❌ Error loading documents from Google Drive:', error);
            this.handleError(error, 'Google Drive document loading');
        }
    }
    /**
     * Load documents from text content
     */
    async loadDocumentsFromText(textDocuments) {
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
            // Add chunks to vector store in batches for better performance
            console.log(`🔗 Adding ${chunks.length} chunks to vector store...`);
            const vectorStartTime = Date.now();
            const vectorChunks = chunks.map(chunk => ({
                ...chunk,
                documentId: chunk.metadata.documentId,
                createdAt: new Date()
            }));
            // Process chunks in batches to avoid memory issues
            const batchSize = 50;
            for (let i = 0; i < vectorChunks.length; i += batchSize) {
                const batch = vectorChunks.slice(i, i + batchSize);
                await this.vectorStoreService.addChunks(batch);
                console.log(`📊 Processed vector batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorChunks.length / batchSize)}`);
            }
            const vectorTime = Date.now() - vectorStartTime;
            console.log(`✅ Vector store operations completed in ${vectorTime}ms`);
            // Store document metadata in parallel
            const metadataPromises = documents.map(async (doc) => {
                this.loadedDocuments.set(doc.id, {
                    ...doc,
                    chunksCount: chunks.filter(c => c.metadata.documentId === doc.id).length,
                    loadedAt: new Date()
                });
                // Save to repository if available
                if (this.repository) {
                    await this.repository.saveDocument({
                        name: doc.title,
                        content: doc.content,
                        source: doc.source
                    });
                }
            });
            await Promise.all(metadataPromises);
            console.log(`💾 Document metadata saved for ${documents.length} documents`);
            console.log(`✅ Successfully loaded ${documents.length} documents with ${chunks.length} chunks`);
            return {
                success: true,
                message: `Loaded ${documents.length} documents successfully`,
                documents: documents,
                chunks: chunks
            };
        }
        catch (error) {
            console.error('❌ Error loading text documents:', error);
            this.handleError(error, 'Text document loading');
        }
    }
    /**
     * Query the RAG system with a question
     */
    async query(question, options = {}) {
        try {
            const { topK = 5, minSimilarity = 0.15, // Threshold for actually relevant content (lowered for better recall)
            includeContext = true, maxContextLength = 4000, category } = options;
            console.log(`🔍 RAG Service query options:`, {
                topK,
                minSimilarity,
                includeContext,
                maxContextLength,
                category,
                receivedOptions: options
            });
            // Auto-initialize RAG system if not already initialized
            if (!this.isInitialized) {
                console.log('🚀 Auto-initializing RAG system for query...');
                await this.initialize();
            }
            console.log(`🔍 Querying RAG system: "${question}"${category ? ` (Category: ${category})` : ''}`);
            // Search for relevant chunks - use filtered search if category is provided
            let relevantChunks = [];
            if (category) {
                console.log(`🏷️ Using category filter: ${category}`);
                relevantChunks = await this.vectorStoreService.searchWithFilter(question, topK, { category }, minSimilarity);
            }
            else {
                relevantChunks = await this.vectorStoreService.similaritySearch(question, topK, minSimilarity);
            }
            // If no chunks meet the threshold, get the best available ones anyway
            let fallbackChunks = [];
            if (relevantChunks.length === 0) {
                console.log('❌ No chunks above similarity threshold, fetching best available...');
                if (category) {
                    // Use filtered fallback search
                    fallbackChunks = await this.vectorStoreService.searchWithFilter(question, Math.min(topK, 3), { category }, 0.0 // No threshold - get the best available
                    );
                }
                else {
                    fallbackChunks = await this.vectorStoreService.similaritySearch(question, Math.min(topK, 3), // Limit fallback to 3 chunks
                    0.0 // No threshold - get the best available
                    );
                }
                console.log(`📋 Fallback: Found ${fallbackChunks.length} chunks with any similarity`);
            }
            const chunksToProcess = relevantChunks.length > 0 ? relevantChunks : fallbackChunks;
            const hasGoodMatches = relevantChunks.length > 0;
            console.log(`📚 Processing ${chunksToProcess.length} chunks (${hasGoodMatches ? 'good matches' : 'fallback results'})`);
            console.log(`🎯 hasGoodMatches: ${hasGoodMatches}, relevantChunks: ${relevantChunks.length}, fallbackChunks: ${fallbackChunks.length}`);
            // Debug: Log chunk structure and similarities
            if (chunksToProcess.length > 0) {
                console.log('🔍 Chunk similarities:', chunksToProcess.map((chunk, i) => `#${i}: ${chunk.similarity?.toFixed(3) || 'N/A'}`).join(', '));
                console.log('🔍 Sample chunk structure:', {
                    chunkKeys: Object.keys(chunksToProcess[0]),
                    hasDocumentId: !!chunksToProcess[0].documentId,
                    hasChunkId: !!chunksToProcess[0].chunkId,
                    hasText: !!chunksToProcess[0].text,
                    hasSimilarity: !!chunksToProcess[0].similarity
                });
            }
            // Build context from available chunks
            let context = '';
            const sources = [];
            for (const chunk of chunksToProcess) {
                console.log(`🔧 Processing chunk: ${chunk.chunkId || 'NO_CHUNK_ID'}, docId: ${chunk.documentId || 'NO_DOC_ID'}, textLength: ${chunk.text?.length || 0}, similarity: ${chunk.similarity}`);
                if (context.length + chunk.text.length <= maxContextLength) {
                    context += `${chunk.text}\n\n`;
                    // Only add to sources if this is actually a good match (not fallback)
                    if (hasGoodMatches) {
                        sources.push({
                            documentId: chunk.documentId,
                            documentTitle: chunk.metadata?.documentTitle || 'Unknown Document',
                            chunkIndex: chunk.metadata?.chunkIndex || 0,
                            similarity: chunk.similarity,
                            webViewLink: chunk.metadata?.webViewLink || null,
                            preview: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : '')
                        });
                        console.log(`✅ Added source: docId=${chunk.documentId}, similarity=${chunk.similarity}`);
                    }
                    else {
                        console.log(`⚠️ Chunk used for context only (fallback), not added as source`);
                    }
                }
                else {
                    console.log(`⚠️ Skipped chunk due to context length limit`);
                }
            }
            console.log(`📊 Final sources count: ${sources.length}, context length: ${context.length}`);
            if (!includeContext) {
                // Just return the sources without generating an answer
                return {
                    success: hasGoodMatches,
                    message: hasGoodMatches
                        ? `Found ${sources.length} relevant sources`
                        : `No relevant content found for your query.`,
                    sources, // Will be empty if no good matches
                    context
                };
            }
            // Only generate AI answer when we have good matches
            let answer = undefined;
            if (hasGoodMatches) {
                const systemPrompt = `You are a helpful AI assistant. Use the following context to answer the user's question. If the context doesn't contain enough information to answer the question, say so clearly.

Context:
${context}

Please provide a comprehensive answer based on the context above.`;
                answer = await this.chatService.generateResponse(question, [], { systemPrompt });
                console.log('✅ Generated RAG response');
            }
            else {
                console.log('⚠️ No AI response generated - no relevant content found');
            }
            const finalResponse = {
                success: hasGoodMatches,
                message: hasGoodMatches
                    ? 'Query completed successfully'
                    : 'No relevant content found in your documents',
                answer, // Will be undefined if no good matches
                sources, // Will be empty array if no good matches
                retrievedChunks: sources.length,
                context: includeContext ? context : undefined
            };
            console.log('🚀 Final RAG response being returned:', {
                success: finalResponse.success,
                sourcesCount: finalResponse.sources.length,
                hasAnswer: !!finalResponse.answer,
                hasContext: !!finalResponse.context,
                sourcesPreview: finalResponse.sources.slice(0, 2).map(s => ({
                    docId: s.documentId,
                    documentTitle: s.documentTitle,
                    similarity: s.similarity,
                    preview: s.preview.substring(0, 50) + '...'
                }))
            });
            return finalResponse;
        }
        catch (error) {
            console.error('❌ Error in RAG query:', error);
            this.handleError(error, 'RAG query');
        }
    }
    /**
     * Get RAG system status
     */
    async getStatus() {
        try {
            const vectorStoreStats = await this.vectorStoreService.getStats();
            return {
                initialized: this.isInitialized,
                documentsLoaded: this.loadedDocuments.size,
                vectorStoreStats,
                lastActivity: new Date()
            };
        }
        catch (error) {
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
    getLoadedDocuments() {
        return Array.from(this.loadedDocuments.values());
    }
    /**
     * Remove a document from the RAG system
     */
    async removeDocument(documentId) {
        try {
            // Remove from vector store
            await this.vectorStoreService.removeDocument(documentId);
            // Remove from loaded documents
            this.loadedDocuments.delete(documentId);
            // Remove from repository if available
            if (this.repository) {
                await this.repository.deleteDocument(documentId);
            }
            console.log(`🗑️ Removed document ${documentId} from RAG system`);
            return true;
        }
        catch (error) {
            console.error(`Error removing document ${documentId}:`, error);
            return false;
        }
    }
    /**
     * Clear all documents from the RAG system
     */
    async clearAllDocuments() {
        try {
            // Clear vector store
            await this.vectorStoreService.clear();
            // Clear loaded documents
            this.loadedDocuments.clear();
            // Clear repository if available
            if (this.repository) {
                await this.repository.clearAll();
            }
            console.log('🗑️ Cleared all documents from RAG system');
            return true;
        }
        catch (error) {
            console.error('Error clearing all documents:', error);
            return false;
        }
    }
    /**
     * Search documents by title or content
     */
    async searchDocuments(query) {
        try {
            if (this.repository) {
                return await this.repository.searchDocuments(query);
            }
            // Fallback: search in loaded documents
            const results = [];
            const queryLower = query.toLowerCase();
            for (const doc of this.loadedDocuments.values()) {
                if (doc.title?.toLowerCase().includes(queryLower) ||
                    doc.content?.toLowerCase().includes(queryLower)) {
                    results.push(doc);
                }
            }
            return results;
        }
        catch (error) {
            console.error('Error searching documents:', error);
            return [];
        }
    }
}
