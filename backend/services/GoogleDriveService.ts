import { BaseService } from '../utils/BaseService.js';
import { google } from 'googleapis';
import type { drive_v3, docs_v1 } from 'googleapis';
import type { GoogleAuth } from 'google-auth-library';
import type { RagRepository } from '../repositories/RagRepository.js';

interface GoogleDocFile {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
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

interface SavedDocument {
  sourceId: string;
  title?: string;
  fileName?: string;
  content: string;
  lastModified?: string;
  webViewLink?: string;
  source: string;
}

/**
 * Service for handling Google Drive document access
 */
export class GoogleDriveService extends BaseService {
  private auth: GoogleAuth | null;
  private drive: drive_v3.Drive | null;
  private docs: docs_v1.Docs | null;

  constructor(ragRepository?: RagRepository) {
    super(ragRepository);
    this.auth = null;
    this.drive = null;
    this.docs = null;
  }

  /**
   * Initialize Google Drive API with service account or OAuth
   */
  async initialize(): Promise<boolean> {
    try {
      // Option 1: Service Account JSON string
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
          ]
        });
      }
      // Option 2: Standard Google Cloud credentials file (GOOGLE_APPLICATION_CREDENTIALS)
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
          ]
        });
        console.log('🔑 Using Google Application Credentials from:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      }
      // Option 3: Custom credentials file path
      else if (process.env.GOOGLE_CREDENTIALS_PATH) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
          scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
          ]
        });
      }
      // Option 4: Default Application Default Credentials (if running on Google Cloud)
      else {
        try {
          this.auth = new google.auth.GoogleAuth({
            scopes: [
              'https://www.googleapis.com/auth/drive.readonly',
              'https://www.googleapis.com/auth/documents.readonly'
            ]
          });
          console.log('🔑 Using Application Default Credentials');
        } catch (error) {
          throw new Error('Google credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_SERVICE_ACCOUNT_KEY, or GOOGLE_CREDENTIALS_PATH');
        }
      }

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.docs = google.docs({ version: 'v1', auth: this.auth });

      console.log('✅ Google Drive API initialized successfully');
      return true;
    } catch (error) {
      this.handleError(error as Error, 'Google Drive API initialization');
    }
  }

  /**
   * List Google Docs in a specific folder or all accessible docs
   */
  async listDocuments(folderId: string | null = null, maxResults: number = 100): Promise<GoogleDocFile[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized. Call initialize() first.');
      }

      const query = folderId 
        ? `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`
        : "mimeType='application/vnd.google-apps.document'";

      const response = await this.drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, modifiedTime, size, webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      return (response.data.files || []) as GoogleDocFile[];
    } catch (error) {
      this.handleError(error as Error, 'Document listing');
    }
  }

  /**
   * List ALL Google Docs from your account (not limited to folders)
   */
  async listAllGoogleDocs(options: ListDocumentsOptions = {}): Promise<GoogleDocFile[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized. Call initialize() first.');
      }

      const { 
        maxResults = 100, 
        includeShared = true, 
        searchQuery = null 
      } = options;

      let query = "mimeType='application/vnd.google-apps.document'";
      
      // Add search query if provided
      if (searchQuery) {
        query += ` and name contains '${searchQuery}'`;
      }

      // Include or exclude shared documents
      if (!includeShared) {
        query += " and 'me' in owners";
      }

      const response = await this.drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, modifiedTime, size, webViewLink, owners, shared)',
        orderBy: 'modifiedTime desc'
      });

      console.log(`📋 Found ${response.data.files?.length || 0} Google Docs in your account`);
      return (response.data.files || []) as GoogleDocFile[];
    } catch (error) {
      this.handleError(error as Error, 'All Google Docs listing');
    }
  }

  /**
   * Advanced search for Google Docs by content and metadata
   */
  async searchGoogleDocs(searchQuery: string, maxResults: number = 20): Promise<GoogleDocFile[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized. Call initialize() first.');
      }

      this.validateInput({ searchQuery }, ['searchQuery']);

      // Search in document name and full text content
      const query = `(name contains '${searchQuery}' or fullText contains '${searchQuery}') and mimeType='application/vnd.google-apps.document'`;
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, modifiedTime, webViewLink, owners)',
        orderBy: 'relevance desc'
      });

      console.log(`🔍 Found ${response.data.files?.length || 0} Google Docs matching: "${searchQuery}"`);
      return (response.data.files || []) as GoogleDocFile[];
    } catch (error) {
      this.handleError(error as Error, 'Google Docs search');
    }
  }

  /**
   * Get Google Doc content as plain text
   */
  async getDocumentContent(documentId: string): Promise<DocumentContent> {
    try {
      if (!this.docs) {
        throw new Error('Google Docs API not initialized. Call initialize() first.');
      }

      this.validateInput({ documentId }, ['documentId']);

      const response = await this.docs.documents.get({
        documentId: documentId
      });

      const doc = response.data;
      let text = '';

      // Extract text from document structure
      if (doc.body && doc.body.content) {
        text = this.extractTextFromContent(doc.body.content);
      }

      return {
        id: documentId,
        title: doc.title || undefined,
        content: text,
        lastModified: doc.revisionId || undefined
      };
    } catch (error) {
      this.handleError(error as Error, `Document content retrieval for ${documentId}`);
    }
  }

  /**
   * Extract plain text from Google Docs API content structure
   */
  private extractTextFromContent(content: docs_v1.Schema$StructuralElement[]): string {
    let text = '';

    for (const element of content) {
      if (element.paragraph) {
        for (const paragraphElement of element.paragraph.elements || []) {
          if (paragraphElement.textRun) {
            text += paragraphElement.textRun.content || '';
          }
        }
      } else if (element.table) {
        // Handle tables
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            text += this.extractTextFromContent(cell.content || []);
          }
        }
      }
    }

    return text;
  }

  /**
   * Download and process multiple documents
   */
  async loadDocuments(documentIds: string[] | null = null, folderId: string | null = null): Promise<DocumentContent[]> {
    try {
      const documents: DocumentContent[] = [];

      if (documentIds && Array.isArray(documentIds)) {
        // Load specific documents by ID
        for (const docId of documentIds) {
          try {
            const doc = await this.getDocumentContent(docId);
            documents.push(doc);
          } catch (error) {
            console.warn(`Failed to load document ${docId}:`, (error as Error).message);
          }
        }
      } else {
        // Load all documents from folder or accessible docs
        const fileList = await this.listDocuments(folderId);
        
        for (const file of fileList) {
          try {
            const doc = await this.getDocumentContent(file.id);
            doc.fileName = file.name;
            doc.webViewLink = file.webViewLink;
            documents.push(doc);
          } catch (error) {
            console.warn(`Failed to load document ${file.name}:`, (error as Error).message);
          }
        }
      }

      console.log(`📄 Loaded ${documents.length} documents from Google Drive`);
      return documents;
    } catch (error) {
      this.handleError(error as Error, 'Documents loading');
    }
  }

  /**
   * Search for documents by name
   */
  async searchDocuments(query: string, maxResults: number = 20): Promise<GoogleDocFile[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized. Call initialize() first.');
      }

      this.validateInput({ query }, ['query']);

      const searchQuery = `name contains '${query}' and mimeType='application/vnd.google-apps.document'`;
      
      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: maxResults,
        fields: 'files(id, name, modifiedTime, webViewLink)',
        orderBy: 'relevance desc'
      });

      return (response.data.files || []) as GoogleDocFile[];
    } catch (error) {
      this.handleError(error as Error, 'Document search');
    }
  }

  /**
   * Load and save documents to repository
   */
  async loadAndSaveDocuments(documentIds: string[] | null = null, folderId: string | null = null): Promise<any[]> {
    try {
      const documents = await this.loadDocuments(documentIds, folderId);
      const savedDocuments: any[] = [];

      for (const doc of documents) {
        if (this.repository) {
          const savedDoc = await (this.repository as RagRepository).saveDocument({
            name: doc.title || doc.fileName || 'Untitled',
            title: doc.title,
            content: doc.content,
            source: 'google-drive',
            mimeType: 'application/vnd.google-apps.document'
          });
          savedDocuments.push(savedDoc);
        } else {
          savedDocuments.push(doc);
        }
      }

      return savedDocuments;
    } catch (error) {
      this.handleError(error as Error, 'Document loading and saving');
    }
  }
}