import { BaseService } from '../utils/BaseService.js';
import multer from 'multer';
import type { RagRepository } from '../repositories/RagRepository.js';
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}
interface ProcessedDocument {
    id: string;
    name: string;
    content: string;
    mimeType: string;
    size: number;
    path: string;
    extractedText?: string;
    metadata?: Record<string, any>;
}
/**
 * Service for handling file uploads and document processing
 */
export declare class FileUploadService extends BaseService {
    private uploadDir;
    private maxFileSize;
    private allowedMimeTypes;
    private allowedExtensions;
    constructor(ragRepository?: RagRepository);
    /**
     * Initialize upload directory
     */
    initialize(): Promise<boolean>;
    /**
     * Configure multer for file uploads
     */
    getMulterConfig(): multer.Multer;
    /**
     * Process uploaded file and extract text content
     */
    processUploadedFile(file: UploadedFile): Promise<ProcessedDocument>;
    /**
     * Process multiple uploaded files
     */
    processUploadedFiles(files: UploadedFile[]): Promise<ProcessedDocument[]>;
    /**
     * Get supported file formats
     */
    getSupportedFormats(): {
        mimeTypes: string[];
        extensions: string[];
    };
    /**
     * Clean up uploaded file
     */
    cleanupFile(filePath: string): Promise<boolean>;
    /**
     * Clean up multiple files
     */
    cleanupFiles(filePaths: string[]): Promise<number>;
    /**
     * Get upload directory stats
     */
    getUploadStats(): Promise<{
        totalFiles: number;
        totalSize: number;
    }>;
    /**
     * Validate file before processing
     */
    validateFile(file: UploadedFile): {
        valid: boolean;
        error?: string;
    };
}
export {};
