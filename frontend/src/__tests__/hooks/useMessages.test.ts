import { renderHook, act } from '@testing-library/react';
import { useMessages } from '../../hooks/useMessages';
import { MessageService } from '../../services/messageService';
import { Message } from '../../types/models';

// Mock MessageService
const mockMessageService = {
  generateUniqueId: jest.fn(() => 'test-id-123'),
  formatMessage: jest.fn((content: string) => content),
  formatTimeAgo: jest.fn(() => 'just now'),
  formatTime: jest.fn(() => '12:00 PM'),
};

describe('useMessages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));

    expect(result.current.messages).toEqual([]);
    expect(result.current.streamingMessage).toBeNull();
  });

  it('should add messages correctly', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    const testMessage = new Message('test-id', 'user', 'Hello');

    act(() => {
      result.current.addMessage(testMessage);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toBe(testMessage);
  });

  it('should update messages by ID', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    const testMessage = new Message('test-id', 'user', 'Hello');

    act(() => {
      result.current.addMessage(testMessage);
    });

    act(() => {
      result.current.updateMessage('test-id', { content: 'Updated content' });
    });

    expect(result.current.messages[0].content).toBe('Updated content');
    expect(result.current.messages[0].id).toBe('test-id'); // ID should remain the same
  });

  it('should not update messages with non-matching ID', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    const testMessage = new Message('test-id', 'user', 'Hello');

    act(() => {
      result.current.addMessage(testMessage);
    });

    act(() => {
      result.current.updateMessage('different-id', { content: 'Updated content' });
    });

    expect(result.current.messages[0].content).toBe('Hello'); // Should remain unchanged
  });

  it('should clear all messages', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    const testMessage = new Message('test-id', 'user', 'Hello');

    act(() => {
      result.current.addMessage(testMessage);
      result.current.setStreamingMessage(testMessage);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.streamingMessage).toBe(testMessage);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.streamingMessage).toBeNull();
  });

  it('should create user messages with generated ID', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));

    act(() => {
      const userMessage = result.current.createUserMessage('User message');
      result.current.addMessage(userMessage);
    });

    expect(mockMessageService.generateUniqueId).toHaveBeenCalled();
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('User message');
    // Test that the ID is present and is a string (don't test exact value)
    expect(typeof result.current.messages[0].id).toBe('string');
    expect(result.current.messages[0].id.length).toBeGreaterThan(0);
  });

  it('should create assistant messages with generated ID', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));

    act(() => {
      const assistantMessage = result.current.createAssistantMessage('Assistant response');
      result.current.addMessage(assistantMessage);
    });

    expect(mockMessageService.generateUniqueId).toHaveBeenCalled();
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toBe('Assistant response');
    // Test that the ID is present and is a string (don't test exact value)
    expect(typeof result.current.messages[0].id).toBe('string');
    expect(result.current.messages[0].id.length).toBeGreaterThan(0);
  });

  it('should handle multiple messages correctly', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    
    const message1 = new Message('id-1', 'user', 'First message');
    const message2 = new Message('id-2', 'assistant', 'Second message');
    const message3 = new Message('id-3', 'user', 'Third message');

    act(() => {
      result.current.addMessage(message1);
      result.current.addMessage(message2);
      result.current.addMessage(message3);
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[0]).toBe(message1);
    expect(result.current.messages[1]).toBe(message2);
    expect(result.current.messages[2]).toBe(message3);
  });

  it('should preserve message order when updating', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    
    const message1 = new Message('id-1', 'user', 'First');
    const message2 = new Message('id-2', 'assistant', 'Second');
    const message3 = new Message('id-3', 'user', 'Third');

    act(() => {
      result.current.addMessage(message1);
      result.current.addMessage(message2);
      result.current.addMessage(message3);
    });

    act(() => {
      result.current.updateMessage('id-2', { content: 'Updated second' });
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[0].content).toBe('First');
    expect(result.current.messages[1].content).toBe('Updated second');
    expect(result.current.messages[2].content).toBe('Third');
  });

  it('should handle streaming message updates', () => {
    const { result } = renderHook(() => useMessages(mockMessageService));
    const streamingMessage = new Message('stream-id', 'assistant', 'Streaming...');

    act(() => {
      result.current.setStreamingMessage(streamingMessage);
    });

    expect(result.current.streamingMessage).toBe(streamingMessage);

    act(() => {
      result.current.setStreamingMessage(null);
    });

    expect(result.current.streamingMessage).toBeNull();
  });
});