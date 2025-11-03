import React from 'react';
import { UIService } from '../../services/uiService';

// Mock DOM elements and methods
const mockScrollIntoView = jest.fn();
const mockElement = {
  scrollIntoView: mockScrollIntoView,
} as any;

const mockTextarea = {
  style: { height: '' },
  scrollHeight: 100,
} as any;

const mockRef = {
  current: mockElement,
};

const mockTextareaRef = {
  current: mockTextarea,
};

describe('UIService', () => {
  let uiService: UIService;

  beforeEach(() => {
    uiService = new UIService();
    jest.clearAllMocks();
  });

  describe('scrollToBottom', () => {
    it('should call scrollIntoView when element exists', () => {
      uiService.scrollToBottom(mockRef);
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should not throw when element is null', () => {
      const nullRef = { current: null } as unknown as React.RefObject<HTMLElement>;
      
      expect(() => {
        uiService.scrollToBottom(nullRef);
      }).not.toThrow();
      
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('adjustTextareaHeight', () => {
    it('should adjust textarea height based on scroll height', () => {
      uiService.adjustTextareaHeight(mockTextareaRef);
      
      // Final height should be set to scrollHeight (100px)
      expect(mockTextarea.style.height).toBe('100px');
    });

    it('should limit height to maximum of 120px', () => {
      mockTextarea.scrollHeight = 200;
      
      uiService.adjustTextareaHeight(mockTextareaRef);
      
      expect(mockTextarea.style.height).toBe('120px'); // limited to max
    });

    it('should not throw when textarea is null', () => {
      const nullRef = { current: null } as unknown as React.RefObject<HTMLTextAreaElement>;
      
      expect(() => {
        uiService.adjustTextareaHeight(nullRef);
      }).not.toThrow();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = uiService.debounce(mockFn, 100);
      
      // Call multiple times quickly
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();
      
      // Should be called after delay with last arguments
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg3');
        done();
      }, 150);
    });

    it('should reset timer on subsequent calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = uiService.debounce(mockFn, 100);
      
      debouncedFn('first');
      
      setTimeout(() => {
        debouncedFn('second'); // This should reset the timer
      }, 50);
      
      setTimeout(() => {
        expect(mockFn).not.toHaveBeenCalled(); // Still waiting
      }, 120);
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('second');
        done();
      }, 200);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(uiService.formatFileSize(0)).toBe('0 Bytes');
      expect(uiService.formatFileSize(500)).toBe('500 Bytes');
      expect(uiService.formatFileSize(1000)).toBe('1000 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(uiService.formatFileSize(1024)).toBe('1 KB');
      expect(uiService.formatFileSize(1536)).toBe('1.5 KB');
      expect(uiService.formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(uiService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(uiService.formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(uiService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(uiService.formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });
  });

  describe('validateFileType', () => {
    const mockFile = (name: string) => ({ name } as File);

    it('should validate allowed file types', () => {
      const allowedTypes = ['.pdf', '.docx', '.txt'];
      
      expect(uiService.validateFileType(mockFile('document.pdf'), allowedTypes)).toBe(true);
      expect(uiService.validateFileType(mockFile('document.docx'), allowedTypes)).toBe(true);
      expect(uiService.validateFileType(mockFile('readme.txt'), allowedTypes)).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const allowedTypes = ['.pdf', '.docx', '.txt'];
      
      expect(uiService.validateFileType(mockFile('image.jpg'), allowedTypes)).toBe(false);
      expect(uiService.validateFileType(mockFile('video.mp4'), allowedTypes)).toBe(false);
      expect(uiService.validateFileType(mockFile('archive.zip'), allowedTypes)).toBe(false);
    });

    it('should handle case insensitive extensions', () => {
      const allowedTypes = ['.pdf', '.docx'];
      
      expect(uiService.validateFileType(mockFile('document.PDF'), allowedTypes)).toBe(true);
      expect(uiService.validateFileType(mockFile('document.Docx'), allowedTypes)).toBe(true);
    });

    it('should handle files without extensions', () => {
      const allowedTypes = ['.pdf'];
      
      expect(uiService.validateFileType(mockFile('noextension'), allowedTypes)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    const mockFile = (size: number) => ({ size } as File);

    it('should validate files within size limit', () => {
      const maxSizeInMB = 10;
      
      expect(uiService.validateFileSize(mockFile(1024 * 1024 * 5), maxSizeInMB)).toBe(true); // 5MB
      expect(uiService.validateFileSize(mockFile(1024 * 1024 * 10), maxSizeInMB)).toBe(true); // 10MB exactly
      expect(uiService.validateFileSize(mockFile(1024 * 1024 * 1), maxSizeInMB)).toBe(true); // 1MB
    });

    it('should reject files exceeding size limit', () => {
      const maxSizeInMB = 10;
      
      expect(uiService.validateFileSize(mockFile(1024 * 1024 * 15), maxSizeInMB)).toBe(false); // 15MB
      expect(uiService.validateFileSize(mockFile(1024 * 1024 * 20), maxSizeInMB)).toBe(false); // 20MB
    });

    it('should handle zero size files', () => {
      const maxSizeInMB = 10;
      
      expect(uiService.validateFileSize(mockFile(0), maxSizeInMB)).toBe(true);
    });
  });
});