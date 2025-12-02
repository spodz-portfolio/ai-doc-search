import { Message, RagMessage } from '../../types/models';

describe('Message Model', () => {
  describe('constructor', () => {
    it('should create a message with all required properties', () => {
      const id = 'test-id';
      const role = 'user';
      const content = 'Hello world';
      const timestamp = new Date();
      
      const message = new Message(id, role, content, timestamp, false);
      
      expect(message.id).toBe(id);
      expect(message.role).toBe(role);
      expect(message.content).toBe(content);
      expect(message.timestamp).toBe(timestamp);
      expect(message.isLoading).toBe(false);
    });

    it('should use default values for optional parameters', () => {
      const message = new Message('id', 'user', 'content');
      
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.isLoading).toBe(false);
    });
  });

  describe('static create', () => {
    it('should create a message with generated ID when no ID provided', () => {
      const message = Message.create('assistant', 'Hello there');
      
      expect(message.id).toBeDefined();
      expect(message.id).toMatch(/^\d+-[a-z0-9]+$/);
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hello there');
    });

    it('should use provided ID when given', () => {
      const customId = 'custom-id';
      const message = Message.create('system', 'System message', customId);
      
      expect(message.id).toBe(customId);
      expect(message.role).toBe('system');
      expect(message.content).toBe('System message');
    });
  });

  describe('instance methods', () => {
    let message: Message;

    beforeEach(() => {
      message = new Message('test-id', 'user', 'test content');
    });

    it('should identify user messages correctly', () => {
      expect(message.isUser()).toBe(true);
      expect(message.isAssistant()).toBe(false);
    });

    it('should identify assistant messages correctly', () => {
      const assistantMessage = new Message('id', 'assistant', 'content');
      
      expect(assistantMessage.isUser()).toBe(false);
      expect(assistantMessage.isAssistant()).toBe(true);
    });

    it('should set loading state and return self', () => {
      const result = message.setLoading(true);
      
      expect(message.isLoading).toBe(true);
      expect(result).toBe(message); // Should return self for chaining
    });
  });
});

describe('RagMessage Model', () => {
  const mockSources = [
    {
      documentId: 'doc-1',
      documentTitle: 'Test Document',
      chunkIndex: 0,
      similarity: 0.85,
      preview: 'Test preview',
    },
  ];

  describe('constructor', () => {
    it('should create RAG message with all properties', () => {
      const ragMessage = new RagMessage(
        'rag-id',
        'assistant',
        'RAG response',
        new Date(),
        false,
        mockSources,
        3
      );

      expect(ragMessage.id).toBe('rag-id');
      expect(ragMessage.role).toBe('assistant');
      expect(ragMessage.content).toBe('RAG response');
      expect(ragMessage.sources).toBe(mockSources);
      expect(ragMessage.retrievedChunks).toBe(3);
    });

    it('should use default values for optional parameters', () => {
      const ragMessage = new RagMessage('id', 'assistant', 'content');
      
      expect(ragMessage.sources).toEqual([]);
      expect(ragMessage.retrievedChunks).toBe(0);
    });
  });

  describe('static createFromResponse', () => {
    it('should create RAG message from successful response with nested data', () => {
      const response = {
        success: true,
        data: {
          answer: 'This is the answer',
          sources: mockSources,
          retrievedChunks: 5,
        },
      };

      const ragMessage = RagMessage.createFromResponse(response, 'custom-id');

      expect(ragMessage.id).toBe('custom-id');
      expect(ragMessage.role).toBe('assistant');
      expect(ragMessage.content).toBe('This is the answer');
      expect(ragMessage.sources).toBe(mockSources);
      expect(ragMessage.retrievedChunks).toBe(5);
    });

    it('should create RAG message from successful response with flat structure', () => {
      const response = {
        success: true,
        answer: 'Flat answer',
        sources: mockSources,
        retrievedChunks: 2,
      };

      const ragMessage = RagMessage.createFromResponse(response);

      expect(ragMessage.id).toMatch(/^\d+-[a-z0-9]+$/);
      expect(ragMessage.content).toBe('Flat answer');
      expect(ragMessage.sources).toBe(mockSources);
      expect(ragMessage.retrievedChunks).toBe(2);
    });

    it('should create RAG message from failed response', () => {
      const response = {
        success: false,
        message: 'No relevant documents found',
      };

      const ragMessage = RagMessage.createFromResponse(response);

      expect(ragMessage.content).toBe('No relevant documents found');
      expect(ragMessage.sources).toEqual([]);
      expect(ragMessage.retrievedChunks).toBe(0);
    });

    it('should handle response with missing data gracefully', () => {
      const response = { success: true };

      const ragMessage = RagMessage.createFromResponse(response);

      expect(ragMessage.content).toBe('No answer found in documents.');
      expect(ragMessage.sources).toEqual([]);
      expect(ragMessage.retrievedChunks).toBe(0);
    });
  });

  describe('instance methods', () => {
    it('should detect when sources are present', () => {
      const withSources = new RagMessage('id', 'assistant', 'content', new Date(), false, mockSources);
      const withoutSources = new RagMessage('id', 'assistant', 'content');

      expect(withSources.hasSources()).toBe(true);
      expect(withoutSources.hasSources()).toBe(false);
    });
  });
});

