import { BaseService } from '../utils/BaseService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
// @ts-ignore - mammoth doesn't have complete type definitions
import mammoth from 'mammoth';
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

interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadDir: string;
}

/**
 * Service for handling file uploads and document processing
 */
export class FileUploadService extends BaseService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private allowedExtensions: string[];

  constructor(ragRepository?: RagRepository) {
    super(ragRepository);
    this.uploadDir = './uploads';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/markdown',
      'application/json'
    ];
    this.allowedExtensions = ['.txt', '.pdf', '.docx', '.doc', '.md', '.json'];
  }

  /**
   * Initialize upload directory
   */
  async initialize(): Promise<boolean> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('📁 Upload directory initialized:', this.uploadDir);
      return true;
    } catch (error) {
      this.handleError(error as Error, 'Upload directory initialization');
    }
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      
      if (this.allowedMimeTypes.includes(file.mimetype) || 
          this.allowedExtensions.includes(extension)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type. Allowed: ${this.allowedExtensions.join(', ')}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Maximum 10 files at once
      }
    });
  }

  /**
   * Process uploaded file and extract text content
   */
  async processUploadedFile(file: UploadedFile): Promise<ProcessedDocument> {
    try {
      this.validateInput({ file }, ['file']);

      const extension = path.extname(file.originalname).toLowerCase();
      let extractedText = '';
      
      // Enhanced text extraction with PDF and DOCX support
      if (extension === '.txt' || extension === '.md') {
        extractedText = await fs.readFile(file.path, 'utf-8');
      } else if (extension === '.json') {
        const jsonContent = await fs.readFile(file.path, 'utf-8');
        try {
          const parsed = JSON.parse(jsonContent);
          extractedText = JSON.stringify(parsed, null, 2);
        } catch {
          extractedText = jsonContent;
        }
      } else if (extension === '.pdf') {
        try {
          console.log(`📄 Extracting text from PDF: ${file.originalname} (${file.size} bytes)`);
          const startTime = Date.now();
          
          // For large PDFs, use optimized parsing
          const pdfBuffer = await fs.readFile(file.path);
          const pdfData = await pdfParse(pdfBuffer, {
            // Optimize PDF parsing performance
            max: 0 // No page limit
          });
          
          extractedText = pdfData.text;
          const processingTime = Date.now() - startTime;
          
          console.log(`✅ PDF text extracted: ${extractedText.length} characters in ${processingTime}ms`);
          console.log(`📊 PDF stats: ${pdfData.numpages} pages, ${Math.round(extractedText.length / pdfData.numpages)} chars/page avg`);
          
          // Force garbage collection for large PDFs
          if (file.size > 5 * 1024 * 1024 && global.gc) { // > 5MB
            global.gc();
            console.log(`🗑️ Triggered garbage collection for large PDF`);
          }
        } catch (error) {
          console.error(`❌ Error extracting PDF text from ${file.originalname}:`, error);
          extractedText = `[Error extracting PDF content: ${(error as Error).message}]`;
        }
      } else if (extension === '.docx') {
        try {
          console.log(`📄 Extracting text from DOCX: ${file.originalname}`);
          const docxBuffer = await fs.readFile(file.path);
          const result = await mammoth.extractRawText({ buffer: docxBuffer });
          extractedText = result.value;
          console.log(`✅ DOCX text extracted: ${extractedText.length} characters`);
          
          if (result.messages.length > 0) {
            console.warn('DOCX extraction warnings:', result.messages);
          }
        } catch (error) {
          console.error(`❌ Error extracting DOCX text from ${file.originalname}:`, error);
          extractedText = `[Error extracting DOCX content: ${(error as Error).message}]`;
        }
      } else if (extension === '.doc') {
        // Legacy DOC files are harder to parse, provide helpful message
        extractedText = `[Legacy DOC files are not supported. Please convert to DOCX format for better text extraction]`;
        console.warn(`⚠️ Legacy DOC file not supported: ${file.originalname}`);
      } else {
        // Unsupported file type
        extractedText = `[${extension.toUpperCase()} file content extraction not supported]`;
        console.warn(`⚠️ Text extraction for ${extension} files not supported`);
      }

      // Log extraction results
      console.log(`📊 File processing summary for "${file.originalname}":`);
      console.log(`   📏 Original file size: ${file.size} bytes`);
      console.log(`   📝 Extracted text length: ${extractedText.length} characters`);
      console.log(`   🔤 Text preview: ${extractedText.substring(0, 100)}${extractedText.length > 100 ? '...' : ''}`);

      const processedDoc: ProcessedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.originalname,
        content: extractedText,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        extractedText,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname,
          extension,
          encoding: file.encoding,
          extractedTextLength: extractedText.length
        }
      };

      // Save to repository if available
      if (this.repository) {
        await (this.repository as RagRepository).saveDocument({
          name: processedDoc.name,
          content: processedDoc.content,
          source: 'file_upload',
          mimeType: processedDoc.mimeType,
          fileSize: processedDoc.size
        });
      }

      return processedDoc;
    } catch (error) {
      this.handleError(error as Error, `Processing uploaded file ${file.originalname}`);
    }
  }

  /**
   * Process multiple uploaded files with controlled concurrency
   */
  async processUploadedFiles(files: UploadedFile[]): Promise<ProcessedDocument[]> {
    try {
      this.validateInput({ files }, ['files']);

      if (!Array.isArray(files)) {
        throw new Error('Files must be an array');
      }

      console.log(`📤 Starting parallel processing of ${files.length} files...`);
      const startTime = Date.now();

      // Process files in parallel with controlled concurrency (max 3 at once)
      const processedDocs = await this.processFilesWithConcurrency(files, 3);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Processed ${processedDocs.length}/${files.length} files in ${processingTime}ms`);
      console.log(`⚡ Average processing time: ${Math.round(processingTime / files.length)}ms per file`);

      return processedDocs;
    } catch (error) {
      this.handleError(error as Error, 'Processing multiple uploaded files');
    }
  }

  /**
   * Process files with controlled concurrency to avoid overwhelming the system
   */
  private async processFilesWithConcurrency(files: UploadedFile[], concurrency: number): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];
    const errors: string[] = [];

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      console.log(`� Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(files.length / concurrency)} (${batch.length} files)`);

      const batchPromises = batch.map(async (file) => {
        try {
          const startTime = Date.now();
          const result = await this.processUploadedFile(file);
          const processingTime = Date.now() - startTime;
          console.log(`✅ Processed "${file.originalname}" in ${processingTime}ms`);
          return result;
        } catch (error) {
          const errorMsg = `Error processing ${file.originalname}: ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as ProcessedDocument[]);
    }

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} files failed to process:`, errors);
    }

    return results;
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): { mimeTypes: string[]; extensions: string[] } {
    return {
      mimeTypes: [...this.allowedMimeTypes],
      extensions: [...this.allowedExtensions]
    };
  }

  /**
   * Clean up uploaded file
   */
  async cleanupFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Cleaned up file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Clean up multiple files
   */
  async cleanupFiles(filePaths: string[]): Promise<number> {
    let cleaned = 0;
    for (const filePath of filePaths) {
      if (await this.cleanupFile(filePath)) {
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get upload directory stats
   */
  async getUploadStats(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.uploadDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch (error) {
          console.warn(`Could not stat file ${file}:`, error);
        }
      }

      return {
        totalFiles: files.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting upload stats:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: UploadedFile): { valid: boolean; error?: string } {
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (!this.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file extension: ${extension}. Allowed: ${this.allowedExtensions.join(', ')}`
      };
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Unsupported MIME type: ${file.mimetype}`
      };
    }

    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large: ${file.size} bytes. Maximum: ${this.maxFileSize} bytes`
      };
    }

    return { valid: true };
  }
}