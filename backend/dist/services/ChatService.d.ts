import { BaseService } from '../utils/BaseService.js';
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
interface ChatCompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}
/**
 * Simplified ChatService for RAG system OpenAI integration only
 * This service is used internally by RAG to generate responses from retrieved context
 */
export declare class ChatService extends BaseService {
    private openai;
    private defaultModel;
    private maxTokens;
    private temperature;
    constructor();
    /**
     * Generate a response using OpenAI for RAG system
     * This is used internally by RAG to create answers from retrieved context
     */
    generateResponse(userMessage: string, conversationHistory?: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
}
export {};
