import { useState, useEffect, useCallback } from 'react';
import { Message, RagMessage, ChatOptions } from '../types/models';
import { IChatService, IRagService, IMessageService } from '../types/interfaces';

export const useMessages = (messageService: IMessageService) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? Object.assign(msg, updates) : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
  }, []);

  const createUserMessage = useCallback((content: string): Message => {
    return Message.create('user', content, messageService.generateUniqueId());
  }, [messageService]);

  const createAssistantMessage = useCallback((content: string): Message => {
    return Message.create('assistant', content, messageService.generateUniqueId());
  }, [messageService]);

  return {
    messages,
    streamingMessage,
    setStreamingMessage,
    addMessage,
    updateMessage,
    clearMessages,
    createUserMessage,
    createAssistantMessage,
  };
};