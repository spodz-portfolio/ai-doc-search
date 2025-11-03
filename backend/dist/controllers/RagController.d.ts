import { Request, Response } from 'express';
import { BaseController } from '../utils/BaseController.js';
/**
 * Controller for handling RAG-related endpoints
 */
export declare class RagController extends BaseController {
    private ragRepository;
    private ragService;
    private fileUploadService;
    constructor();
    /**
     * Initialize RAG system
     */
    initialize: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Load documents from Google Drive
     */
    loadFromDrive: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Load documents from Google Docs
     */
    loadFromGoogleDocs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Load documents from text
     */
    loadFromText: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Upload documents
     */
    uploadDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Search and load Google Docs
     */
    searchAndLoadGoogleDocs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get supported formats
     */
    getSupportedFormats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Query documents
     */
    query: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get documents
     */
    getDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Search in document
     */
    searchInDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Remove document
     */
    removeDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Clear documents
     */
    clearDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get status
     */
    getStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get stats
     */
    getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Health check endpoint
     */
    health: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
