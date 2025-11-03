import { renderHook, act } from '@testing-library/react';
import { useChatOptions } from '../../hooks/useChatOptions';
import { ChatOptions } from '../../types/models';

describe('useChatOptions Hook', () => {
  it('should initialize with default options', () => {
    const { result } = renderHook(() => useChatOptions());

    expect(result.current.options.enableStreaming).toBe(true);
    expect(result.current.options.maxTokens).toBe(1000);
    expect(result.current.options.temperature).toBe(0.7);
    expect(result.current.options.searchMode).toBe('openai');
  });

  it('should update options partially', () => {
    const { result } = renderHook(() => useChatOptions());

    act(() => {
      result.current.updateOptions({ temperature: 0.5, maxTokens: 500 });
    });

    expect(result.current.options.temperature).toBe(0.5);
    expect(result.current.options.maxTokens).toBe(500);
    // Other options should remain unchanged
    expect(result.current.options.enableStreaming).toBe(true);
    expect(result.current.options.searchMode).toBe('openai');
  });

  it('should toggle streaming correctly', () => {
    const { result } = renderHook(() => useChatOptions());

    // Initially true
    expect(result.current.options.enableStreaming).toBe(true);

    act(() => {
      result.current.toggleStreaming();
    });

    expect(result.current.options.enableStreaming).toBe(false);

    act(() => {
      result.current.toggleStreaming();
    });

    expect(result.current.options.enableStreaming).toBe(true);
  });

  it('should set search mode correctly', () => {
    const { result } = renderHook(() => useChatOptions());

    act(() => {
      result.current.setSearchMode('rag');
    });

    expect(result.current.options.searchMode).toBe('rag');

    act(() => {
      result.current.setSearchMode('openai');
    });

    expect(result.current.options.searchMode).toBe('openai');
  });

  it('should set temperature correctly', () => {
    const { result } = renderHook(() => useChatOptions());

    act(() => {
      result.current.setTemperature(0.9);
    });

    expect(result.current.options.temperature).toBe(0.9);

    act(() => {
      result.current.setTemperature(0.1);
    });

    expect(result.current.options.temperature).toBe(0.1);
  });

  it('should set max tokens correctly', () => {
    const { result } = renderHook(() => useChatOptions());

    act(() => {
      result.current.setMaxTokens(2000);
    });

    expect(result.current.options.maxTokens).toBe(2000);

    act(() => {
      result.current.setMaxTokens(100);
    });

    expect(result.current.options.maxTokens).toBe(100);
  });

  it('should preserve other options when making specific updates', () => {
    const { result } = renderHook(() => useChatOptions());

    // Set initial custom state
    act(() => {
      result.current.updateOptions({
        temperature: 0.8,
        maxTokens: 1500,
        searchMode: 'rag',
        enableStreaming: false,
      });
    });

    // Update only temperature
    act(() => {
      result.current.setTemperature(0.3);
    });

    expect(result.current.options.temperature).toBe(0.3);
    expect(result.current.options.maxTokens).toBe(1500);
    expect(result.current.options.searchMode).toBe('rag');
    expect(result.current.options.enableStreaming).toBe(false);
  });

  it('should maintain ChatOptions instance type', () => {
    const { result } = renderHook(() => useChatOptions());

    expect(result.current.options).toBeInstanceOf(ChatOptions);

    act(() => {
      result.current.updateOptions({ temperature: 0.5 });
    });

    expect(result.current.options).toBeInstanceOf(ChatOptions);
  });

  it('should handle multiple rapid updates correctly', () => {
    const { result } = renderHook(() => useChatOptions());

    act(() => {
      result.current.setTemperature(0.1);
      result.current.setMaxTokens(200);
      result.current.setSearchMode('rag');
      result.current.toggleStreaming();
    });

    expect(result.current.options.temperature).toBe(0.1);
    expect(result.current.options.maxTokens).toBe(200);
    expect(result.current.options.searchMode).toBe('rag');
    expect(result.current.options.enableStreaming).toBe(false);
  });
});