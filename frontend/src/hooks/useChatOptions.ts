import { useState, useCallback } from 'react';
import { ChatOptions } from '../types/models';

export const useChatOptions = () => {
  const [options, setOptions] = useState<ChatOptions>(ChatOptions.default());

  const updateOptions = useCallback((updates: Partial<ChatOptions>) => {
    setOptions(prev => Object.assign(new ChatOptions(), prev, updates));
  }, []);

  const toggleStreaming = useCallback(() => {
    setOptions(prev => Object.assign(new ChatOptions(), prev, { 
      enableStreaming: !prev.enableStreaming 
    }));
  }, []);

  const setSearchMode = useCallback((mode: 'openai' | 'rag') => {
    setOptions(prev => Object.assign(new ChatOptions(), prev, { 
      searchMode: mode 
    }));
  }, []);

  const setTemperature = useCallback((temperature: number) => {
    setOptions(prev => Object.assign(new ChatOptions(), prev, { temperature }));
  }, []);

  const setMaxTokens = useCallback((maxTokens: number) => {
    setOptions(prev => Object.assign(new ChatOptions(), prev, { maxTokens }));
  }, []);

  return {
    options,
    updateOptions,
    toggleStreaming,
    setSearchMode,
    setTemperature,
    setMaxTokens,
  };
};