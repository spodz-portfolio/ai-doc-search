import { BaseService } from '../utils/BaseService.js';
import { v4 as uuidv4 } from 'uuid';
import type { RagRepository } from '../repositories/RagRepository.js';

interface Document {
  id: string;
  content: string;
  title?: string;
  fileName?: string;
  webViewLink?: string;
  lastModified?: string;
}

interface DocumentChunk {
  id: string;
  text: string;
  content: string;
  metadata: {
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    totalChunks: number;
    webViewLink: string | null;
    lastModified: string | null;
    chunkSize: number;
  };
}

interface DocumentStats {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  keyPhrases: string[];
}

/**
 * Service for processing documents into chunks for RAG
 */
export class DocumentProcessorService extends BaseService {
  private defaultChunkSize: number;
  private defaultOverlap: number;

  constructor(ragRepository?: RagRepository) {
    super(ragRepository);
    this.defaultChunkSize = 1000;
    this.defaultOverlap = 200;
  }

  /**
   * Split text into chunks with overlap for better context preservation
   */
  splitTextIntoChunks(text: string, chunkSize: number = this.defaultChunkSize, overlap: number = this.defaultOverlap): string[] {
    try {
      if (!text || text.trim().length === 0) {
        return [];
      }

      const chunks: string[] = [];
      const sentences = this.splitIntoSentences(text);
      
      let currentChunk = '';
      let currentSize = 0;

      for (const sentence of sentences) {
        const sentenceLength = sentence.length;

        // If adding this sentence would exceed chunk size, finalize current chunk
        if (currentSize + sentenceLength > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          
          // Start new chunk with overlap from previous chunk
          const overlapText = this.getOverlapText(currentChunk, overlap);
          currentChunk = overlapText + sentence;
          currentSize = currentChunk.length;
        } else {
          currentChunk += sentence;
          currentSize += sentenceLength;
        }
      }

      // Add the last chunk if it has content
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
    } catch (error) {
      this.handleError(error as Error, 'Text chunking');
    }
  }

  /**
   * Split text into sentences using multiple delimiters
   */
  splitIntoSentences(text: string): string[] {
    // Clean and normalize text
    const cleanText = text
      .replace(/\n+/g, '\n')  // Normalize line breaks
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();

    // Split on sentence boundaries but keep the delimiter
    const sentences = cleanText.split(/(?<=[\\.!?])\s+(?=[A-Z])/);
    
    return sentences.filter(sentence => sentence.trim().length > 0);
  }

  /**
   * Get overlap text from the end of a chunk
   */
  getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text + ' ';
    }

    // Try to break at word boundary
    const overlapText = text.slice(-overlapSize);
    const spaceIndex = overlapText.indexOf(' ');
    
    if (spaceIndex !== -1) {
      return overlapText.slice(spaceIndex + 1) + ' ';
    }
    
    return overlapText + ' ';
  }

  /**
   * Process a single document into chunks with metadata
   */
  async processDocument(document: Document, chunkSize: number = this.defaultChunkSize, overlap: number = this.defaultOverlap): Promise<DocumentChunk[]> {
    try {
      this.validateInput({ document }, ['document']);

      const chunks = this.splitTextIntoChunks(document.content, chunkSize, overlap);
      
      const processedChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        text: chunk,
        content: chunk, // Keep both for compatibility
        metadata: {
          documentId: document.id,
          documentTitle: document.title || document.fileName || 'Untitled',
          chunkIndex: index,
          totalChunks: chunks.length,
          webViewLink: document.webViewLink || null,
          lastModified: document.lastModified || null,
          chunkSize: chunk.length
        }
      }));

      // Save chunks to repository if available
      if (this.repository) {
        await (this.repository as RagRepository).storeChunks(document.id, processedChunks.map(chunk => ({
          text: chunk.text,
          metadata: chunk.metadata
        })));
      }

      return processedChunks;
    } catch (error) {
      this.handleError(error as Error, `Document processing for ${document.id || document.title}`);
    }
  }

  /**
   * Process multiple documents into chunks
   */
  async processDocuments(documents: Document[], chunkSize: number = this.defaultChunkSize, overlap: number = this.defaultOverlap): Promise<DocumentChunk[]> {
    try {
      this.validateInput({ documents }, ['documents']);

      if (!Array.isArray(documents)) {
        throw new Error('Documents must be an array');
      }

      const allChunks: DocumentChunk[] = [];

      for (const document of documents) {
        try {
          const docChunks = await this.processDocument(document, chunkSize, overlap);
          allChunks.push(...docChunks);
        } catch (error) {
          console.error(`Error processing document ${document.id || document.title}:`, error);
        }
      }

      console.log(`📝 Processed ${documents.length} documents into ${allChunks.length} chunks`);
      return allChunks;
    } catch (error) {
      this.handleError(error as Error, 'Multiple documents processing');
    }
  }

  /**
   * Extract key phrases from text for better retrieval
   */
  extractKeyPhrases(text: string, maxPhrases: number = 10): string[] {
    try {
      // Simple keyword extraction - in production, consider using NLP libraries
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isStopWord(word));

      // Count word frequency
      const wordCount: Record<string, number> = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Sort by frequency and return top phrases
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxPhrases)
        .map(([word]) => word);
    } catch (error) {
      console.error('Error extracting key phrases:', error);
      return [];
    }
  }

  /**
   * Simple stop words list
   */
  isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'around',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Clean and normalize text content
   */
  cleanText(text: string): string {
    try {
      return text
        .replace(/\r\n/g, '\n')        // Normalize line endings
        .replace(/\n+/g, '\n')         // Reduce multiple newlines
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/[^\w\s\n\\.!?,;:-]/g, '') // Remove special characters but keep punctuation
        .trim();
    } catch (error) {
      console.error('Error cleaning text:', error);
      return text || '';
    }
  }

  /**
   * Get document statistics
   */
  getDocumentStats(document: Document): DocumentStats {
    try {
      const content = document.content || '';
      const words = content.split(/\s+/).filter(word => word.length > 0);
      const sentences = this.splitIntoSentences(content);
      
      return {
        characterCount: content.length,
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
        keyPhrases: this.extractKeyPhrases(content, 5)
      };
    } catch (error) {
      console.error('Error calculating document stats:', error);
      return {
        characterCount: 0,
        wordCount: 0,
        sentenceCount: 0,
        avgWordsPerSentence: 0,
        keyPhrases: []
      };
    }
  }

  /**
   * Reprocess document with new chunking parameters
   */
  async reprocessDocument(documentId: string, chunkSize: number = this.defaultChunkSize, overlap: number = this.defaultOverlap): Promise<DocumentChunk[]> {
    try {
      if (!this.repository) {
        throw new Error('Repository required for reprocessing');
      }

      const document = await (this.repository as RagRepository).getDocument(documentId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Remove existing chunks
      const existingChunks = await (this.repository as RagRepository).getDocumentChunks(documentId);
      for (const chunk of existingChunks) {
        // This would need to be implemented in the repository
        // await this.repository.deleteChunk(chunk.id);
      }

      // Reprocess document
      return await this.processDocument(document, chunkSize, overlap);
    } catch (error) {
      this.handleError(error as Error, `Document reprocessing for ${documentId}`);
    }
  }
}