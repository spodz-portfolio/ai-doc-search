import { BaseController } from '../utils/BaseController.js';
import { RagService } from '../services/RagMainService.js';
import { RagRepository } from '../repositories/RagRepository.js';
import { FileUploadService } from '../services/FileUploadService.js';
/**
 * Controller for handling RAG-related endpoints
 */
export class RagController extends BaseController {
    ragRepository;
    ragService;
    fileUploadService;
    constructor() {
        super();
        this.ragRepository = new RagRepository();
        this.ragService = new RagService(this.ragRepository);
        this.fileUploadService = new FileUploadService(this.ragRepository);
        // Initialize file upload service
        this.fileUploadService.initialize();
    }
    /**
     * Initialize RAG system
     */
    initialize = this.asyncHandler(async (req, res) => {
        await this.ragService.initialize();
        this.success(res, {
            initialized: true,
            timestamp: new Date().toISOString()
        }, 'RAG system initialized successfully');
    });
    /**
     * Load documents from Google Drive
     */
    loadFromDrive = this.asyncHandler(async (req, res) => {
        // TODO: Implement after services are converted
        this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
    });
    /**
     * Load documents from Google Docs
     */
    loadFromGoogleDocs = this.asyncHandler(async (req, res) => {
        // TODO: Implement after services are converted
        this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
    });
    /**
     * Load documents from text
     */
    loadFromText = this.asyncHandler(async (req, res) => {
        const { documents } = req.body;
        if (!documents || !Array.isArray(documents)) {
            return this.validationError(res, ['Documents array is required']);
        }
        const result = await this.ragService.loadDocumentsFromText(documents);
        // Always return success from controller perspective
        this.success(res, result);
    });
    /**
     * Upload documents
     */
    uploadDocuments = this.asyncHandler(async (req, res) => {
        try {
            // Get multer configuration from FileUploadService
            const upload = this.fileUploadService.getMulterConfig();
            // Handle file upload using multer
            const uploadMultiple = upload.array('documents', 10); // max 10 files
            uploadMultiple(req, res, async (err) => {
                if (err) {
                    console.error('❌ Upload error:', err);
                    return this.error(res, err, 'File upload failed');
                }
                const files = req.files;
                if (!files || files.length === 0) {
                    return this.validationError(res, ['No files uploaded']);
                }
                console.log(`📤 Processing ${files.length} uploaded files...`);
                const overallStartTime = Date.now();
                // Extract category from request body
                const category = req.body.category;
                console.log(`📂 Document category: ${category || 'none'}`);
                try {
                    // Process uploaded files with parallel optimization
                    const processedDocs = await this.fileUploadService.processUploadedFiles(files);
                    if (processedDocs.length === 0) {
                        return this.error(res, new Error('No files could be processed'), 'File processing failed');
                    }
                    // Convert processed documents to text format for RAG service
                    const textDocuments = processedDocs.map(doc => ({
                        title: doc.name,
                        content: doc.content,
                        id: doc.id,
                        metadata: {
                            ...doc.metadata,
                            category: category || 'uncategorized',
                            uploadDate: new Date().toISOString()
                        }
                    }));
                    // Load documents into RAG system
                    const result = await this.ragService.loadDocumentsFromText(textDocuments);
                    console.log(`📋 Upload result:`, result);
                    // Clean up uploaded files after processing
                    const filePaths = files.map(file => file.path);
                    await this.fileUploadService.cleanupFiles(filePaths);
                    const overallTime = Date.now() - overallStartTime;
                    console.log(`⏱️ Total upload processing time: ${overallTime}ms`);
                    if (result.success) {
                        console.log(`✅ Successfully processed ${processedDocs.length} files into RAG system`);
                        this.success(res, {
                            ...result,
                            uploadedFiles: processedDocs.length,
                            processedDocuments: result.documents?.length || 0,
                            totalChunks: result.chunks?.length || 0,
                            processingTimeMs: overallTime
                        });
                    }
                    else {
                        // Even if documents failed to load, return the result (don't throw error)
                        this.success(res, {
                            ...result,
                            uploadedFiles: processedDocs.length,
                            processedDocuments: 0,
                            totalChunks: 0,
                            processingTimeMs: overallTime
                        });
                    }
                }
                catch (processingError) {
                    console.error('❌ Error processing uploaded files:', processingError);
                    // Clean up uploaded files on error
                    const filePaths = files.map(file => file.path);
                    await this.fileUploadService.cleanupFiles(filePaths);
                    this.error(res, processingError, 'Document processing failed');
                }
            });
        }
        catch (error) {
            console.error('❌ Upload endpoint error:', error);
            this.error(res, error, 'Upload failed');
        }
    });
    /**
     * Search and load Google Docs
     */
    searchAndLoadGoogleDocs = this.asyncHandler(async (req, res) => {
        // TODO: Implement after services are converted
        this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
    });
    /**
     * Get supported formats
     */
    getSupportedFormats = this.asyncHandler(async (req, res) => {
        this.success(res, {
            formats: ['pdf', 'docx', 'txt', 'md']
        });
    });
    /**
     * Query documents
     */
    query = this.asyncHandler(async (req, res) => {
        // Accept both 'query' and 'question' for backward compatibility
        const { query: queryText, question, category, options = {} } = req.body;
        const searchQuery = queryText || question;
        if (!searchQuery) {
            return this.validationError(res, ['Query is required']);
        }
        console.log('🔍 RAG Query Controller received:', {
            query: searchQuery,
            category: category,
            options: options,
            fullBody: req.body
        });
        // Add category to options if provided
        const queryOptions = {
            ...options,
            category: category || undefined
        };
        const result = await this.ragService.query(searchQuery, queryOptions);
        console.log('🎯 RAG Controller result:', {
            success: result.success,
            sourcesCount: result.sources?.length || 0,
            hasAnswer: !!result.answer,
            message: result.message
        });
        // Always return success from controller perspective - result.success indicates content relevance, not API success
        this.success(res, result);
    });
    /**
     * Get documents
     */
    getDocuments = this.asyncHandler(async (req, res) => {
        const documents = await this.ragRepository.getAllDocuments();
        this.success(res, { documents });
    });
    /**
     * Search in document
     */
    searchInDocument = this.asyncHandler(async (req, res) => {
        // TODO: Implement after services are converted
        this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
    });
    /**
     * Remove document
     */
    removeDocument = this.asyncHandler(async (req, res) => {
        const { documentId } = req.params;
        if (!documentId) {
            return this.validationError(res, ['Document ID is required']);
        }
        await this.ragRepository.deleteDocument(documentId);
        this.success(res, {}, 'Document removed successfully');
    });
    /**
     * Clear documents
     */
    clearDocuments = this.asyncHandler(async (req, res) => {
        await this.ragRepository.clearAll();
        this.success(res, {}, 'All documents cleared successfully');
    });
    /**
     * Get status
     */
    getStatus = this.asyncHandler(async (req, res) => {
        const status = await this.ragService.getStatus();
        this.success(res, {
            status: 'active',
            ...status,
            timestamp: new Date().toISOString()
        });
    });
    /**
     * Get stats
     */
    getStats = this.asyncHandler(async (req, res) => {
        const stats = await this.ragRepository.getStats();
        this.success(res, stats);
    });
    /**
     * Health check endpoint
     */
    health = this.asyncHandler(async (req, res) => {
        this.success(res, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'RAG Service'
        });
    });
}
