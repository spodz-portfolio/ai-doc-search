import { Request, Response } from 'express';
import { BaseController } from '../utils/BaseController.js';
import { RagService } from '../services/RagMainService.js';
import { RagRepository } from '../repositories/RagRepository.js';
import { FileUploadService } from '../services/FileUploadService.js';

/**
 * Controller for handling RAG-related endpoints
 */
export class RagController extends BaseController {
  private ragRepository: RagRepository;
  private ragService: RagService;
  private fileUploadService: FileUploadService;

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
  initialize = this.asyncHandler(async (req: Request, res: Response) => {
    await this.ragService.initialize();
    
    this.success(res, {
      initialized: true,
      timestamp: new Date().toISOString()
    }, 'RAG system initialized successfully');
  });

  /**
   * Load documents from Google Drive
   */
  loadFromDrive = this.asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement after services are converted
    this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
  });

  /**
   * Load documents from Google Docs
   */
  loadFromGoogleDocs = this.asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement after services are converted
    this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
  });

  /**
   * Load documents from text
   */
  loadFromText = this.asyncHandler(async (req: Request, res: Response) => {
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return this.validationError(res, ['Documents array is required']);
    }

    const result = await this.ragService.loadDocumentsFromText(documents);
    
    if (result.success) {
      this.success(res, result);
    } else {
      this.error(res, new Error(result.message || 'Failed to load documents'), result.message);
    }
  });

  /**
   * Upload documents
   */
  uploadDocuments = this.asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement after services are converted
    this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
  });

  /**
   * Search and load Google Docs
   */
  searchAndLoadGoogleDocs = this.asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement after services are converted
    this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
  });

  /**
   * Get supported formats
   */
  getSupportedFormats = this.asyncHandler(async (req: Request, res: Response) => {
    this.success(res, {
      formats: ['pdf', 'docx', 'txt', 'md']
    });
  });

  /**
   * Query documents
   */
  query = this.asyncHandler(async (req: Request, res: Response) => {
    const { question, options = {} } = req.body;

    if (!question) {
      return this.validationError(res, ['Question is required']);
    }

    const result = await this.ragService.query(question, options);
    
    if (result.success) {
      this.success(res, result);
    } else {
      this.error(res, new Error(result.message || 'Query failed'), result.message);
    }
  });

  /**
   * Get documents
   */
  getDocuments = this.asyncHandler(async (req: Request, res: Response) => {
    const documents = await this.ragRepository.getAllDocuments();
    this.success(res, { documents });
  });

  /**
   * Search in document
   */
  searchInDocument = this.asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement after services are converted
    this.success(res, { message: "Service not yet implemented in TypeScript conversion" });
  });

  /**
   * Remove document
   */
  removeDocument = this.asyncHandler(async (req: Request, res: Response) => {
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
  clearDocuments = this.asyncHandler(async (req: Request, res: Response) => {
    await this.ragRepository.clearAll();
    this.success(res, {}, 'All documents cleared successfully');
  });

  /**
   * Get status
   */
  getStatus = this.asyncHandler(async (req: Request, res: Response) => {
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
  getStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.ragRepository.getStats();
    this.success(res, stats);
  });

  /**
   * Health check endpoint
   */
  health = this.asyncHandler(async (req: Request, res: Response) => {
    this.success(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'RAG Service'
    });
  });
}