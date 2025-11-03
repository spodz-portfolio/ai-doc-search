import { MessageService } from '../../services/messageService';
import { ISource } from '../../types/interfaces';

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = new MessageService();
  });

  describe('generateUniqueId', () => {
    it('should generate a unique ID', () => {
      const id1 = messageService.generateUniqueId();
      const id2 = messageService.generateUniqueId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp prefix', () => {
      const beforeTime = Date.now();
      const id = messageService.generateUniqueId();
      const afterTime = Date.now();
      
      const timestamp = parseInt(id.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('formatMessage', () => {
    it('should return content as-is when no sources provided', () => {
      const content = 'Hello world';
      const result = messageService.formatMessage(content);
      
      expect(result).toBe(content);
    });

    it('should return content as-is when sources array is empty', () => {
      const content = 'Hello world';
      const result = messageService.formatMessage(content, []);
      
      expect(result).toBe(content);
    });

    it('should format message with sources', () => {
      const content = 'This is the answer';
      const sources: ISource[] = [
        {
          documentId: 'doc-1',
          documentTitle: 'Document 1',
          chunkIndex: 0,
          similarity: 0.85,
          preview: 'Preview text',
        },
        {
          documentId: 'doc-2',
          documentTitle: 'Document 2',
          chunkIndex: 1,
          similarity: 0.75,
          preview: 'Another preview',
        },
      ];

      const result = messageService.formatMessage(content, sources);
      
      expect(result).toContain(content);
      expect(result).toContain('Sources:');
      expect(result).toContain('[1] Document 1 (85% match)');
      expect(result).toContain('[2] Document 2 (75% match)');
    });

    it('should handle sources with webViewLink', () => {
      const content = 'Answer with link';
      const sources: ISource[] = [
        {
          documentId: 'doc-1',
          documentTitle: 'Linked Document',
          chunkIndex: 0,
          similarity: 0.9,
          webViewLink: 'https://example.com/doc',
          preview: 'Preview',
        },
      ];

      const result = messageService.formatMessage(content, sources);
      
      expect(result).toContain('[1] Linked Document (90% match)');
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "just now" for recent timestamps', () => {
      const recentTime = new Date(Date.now() - 30000); // 30 seconds ago
      const result = messageService.formatTimeAgo(recentTime);
      
      expect(result).toBe('just now');
    });

    it('should return minutes for timestamps within an hour', () => {
      const minutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = messageService.formatTimeAgo(minutesAgo);
      
      expect(result).toBe('5m ago');
    });

    it('should return hours for timestamps within a day', () => {
      const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const result = messageService.formatTimeAgo(hoursAgo);
      
      expect(result).toBe('3h ago');
    });

    it('should return date for older timestamps', () => {
      const daysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const result = messageService.formatTimeAgo(daysAgo);
      
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format', () => {
      const testDate = new Date('2024-01-01T14:30:00Z');
      const result = messageService.formatTime(testDate);
      
      // Note: This will depend on the system timezone
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });

    it('should format different times correctly', () => {
      const morning = new Date('2024-01-01T09:15:00Z');
      const afternoon = new Date('2024-01-01T15:45:00Z');
      
      const morningResult = messageService.formatTime(morning);
      const afternoonResult = messageService.formatTime(afternoon);
      
      expect(morningResult).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
      expect(afternoonResult).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });
  });
});