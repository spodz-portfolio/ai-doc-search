import { BaseService } from '../utils/BaseService.js';
import OpenAI from 'openai';
import type { ChatRepository } from '../repositories/ChatRepository.js';
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
interface ChatCompletionResult {
    success: boolean;
    data: OpenAI.Chat.Completions.ChatCompletion;
    message: string;
    usage?: OpenAI.Completions.CompletionUsage;
}
interface ChatSession {
    id: string;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
    [key: string]: any;
}
/**
 * Service for handling OpenAI chat completions
 */
export declare class ChatService extends BaseService {
    private openai;
    private defaultModel;
    private maxTokens;
    private temperature;
    constructor(chatRepository?: ChatRepository);
    /**
     * Generate a chat completion using OpenAI GPT-4o-mini (non-streaming)
     */
    generateChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatCompletionResult>;
    /**
     * Generate a streaming chat completion using OpenAI GPT-4o-mini
     */
    generateStreamingChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>;
    /**
     * Generate a chat response with conversation management
     */
    generateResponse(userMessage: string, conversationHistory?: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
    /**
     * Start a new chat session
     */
    startSession(metadata?: Record<string, any>): Promise<ChatSession>;
    /**
     * Save conversation message
     */
    saveMessage(sessionId: string, message: ChatMessage): Promise<any>;
    /**
     * Get conversation history
     */
    getConversationHistory(sessionId: string): Promise<ChatMessage[]>;
    /**
     * Validate conversation history format
     */
    validateConversationHistory(history: any[]): boolean;
    /**
     * Trim conversation history to stay within token limits
     */
    trimConversationHistory(history: ChatMessage[], maxMessages?: number): ChatMessage[];
    /**
     * Handle OpenAI specific errors
     */
    protected handleError(error: any, operation?: string): never;
}
export {};
