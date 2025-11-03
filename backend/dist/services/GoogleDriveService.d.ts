import { BaseService } from '../utils/BaseService.js';
import type { RagRepository } from '../repositories/RagRepository.js';
interface GoogleDocFile {
    id: string;
    name: string;
    modifiedTime?: string;
    size?: string;
    webViewLink?: string;
    owners?: Array<{
        displayName?: string;
        emailAddress?: string;
    }>;
    shared?: boolean;
}
interface DocumentContent {
    id: string;
    title?: string;
    content: string;
    lastModified?: string;
    fileName?: string;
    webViewLink?: string;
}
interface ListDocumentsOptions {
    maxResults?: number;
    includeShared?: boolean;
    searchQuery?: string | null;
}
/**
 * Service for handling Google Drive document access
 */
export declare class GoogleDriveService extends BaseService {
    private auth;
    private drive;
    private docs;
    constructor(ragRepository?: RagRepository);
    /**
     * Initialize Google Drive API with service account or OAuth
     */
    initialize(): Promise<boolean>;
    /**
     * List Google Docs in a specific folder or all accessible docs
     */
    listDocuments(folderId?: string | null, maxResults?: number): Promise<GoogleDocFile[]>;
    /**
     * List ALL Google Docs from your account (not limited to folders)
     */
    listAllGoogleDocs(options?: ListDocumentsOptions): Promise<GoogleDocFile[]>;
    /**
     * Advanced search for Google Docs by content and metadata
     */
    searchGoogleDocs(searchQuery: string, maxResults?: number): Promise<GoogleDocFile[]>;
    /**
     * Get Google Doc content as plain text
     */
    getDocumentContent(documentId: string): Promise<DocumentContent>;
    /**
     * Extract plain text from Google Docs API content structure
     */
    private extractTextFromContent;
    /**
     * Download and process multiple documents
     */
    loadDocuments(documentIds?: string[] | null, folderId?: string | null): Promise<DocumentContent[]>;
    /**
     * Search for documents by name
     */
    searchDocuments(query: string, maxResults?: number): Promise<GoogleDocFile[]>;
    /**
     * Load and save documents to repository
     */
    loadAndSaveDocuments(documentIds?: string[] | null, folderId?: string | null): Promise<any[]>;
}
export {};
