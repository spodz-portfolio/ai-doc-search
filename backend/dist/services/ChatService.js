import { BaseService } from '../utils/BaseService.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * Service for handling OpenAI chat completions
 */
export class ChatService extends BaseService {
    openai;
    defaultModel;
    maxTokens;
    temperature;
    constructor(chatRepository) {
        super(chatRepository);
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required in environment variables');
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.defaultModel = 'gpt-4o-mini';
        this.maxTokens = 1000;
        this.temperature = 0.7;
    }
    /**
     * Generate a chat completion using OpenAI GPT-4o-mini (non-streaming)
     */
    async generateChatCompletion(messages, options = {}) {
        try {
            const { model = this.defaultModel, maxTokens = this.maxTokens, temperature = this.temperature } = options;
            // Validate messages format
            this.validateInput({ messages }, ['messages']);
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error('Messages must be a non-empty array');
            }
            // Ensure messages have proper format
            const validMessages = messages.map(msg => {
                if (!msg.role || !msg.content) {
                    throw new Error('Each message must have role and content properties');
                }
                return {
                    role: msg.role,
                    content: msg.content
                };
            });
            const completion = await this.openai.chat.completions.create({
                model,
                messages: validMessages,
                max_tokens: maxTokens,
                temperature,
                stream: false
            });
            if (!completion || !completion.choices || completion.choices.length === 0) {
                console.error('Invalid OpenAI response structure:', completion);
                throw new Error('Invalid response from OpenAI API - no choices returned');
            }
            const message = completion.choices[0]?.message?.content;
            if (!message) {
                console.error('No content in OpenAI response:', completion.choices[0]);
                throw new Error('No content returned from OpenAI API');
            }
            return {
                success: true,
                data: completion,
                message: message,
                usage: completion.usage
            };
        }
        catch (error) {
            const err = error;
            console.error('❌ OpenAI API Error Details:', {
                message: err.message,
                status: err.status,
                code: err.code,
                type: err.type,
                response: err.response?.data
            });
            // Provide more specific error messages
            if (err.status === 400) {
                console.error('❌ Bad Request - Invalid parameters or content policy violation');
            }
            else if (err.status === 401) {
                console.error('❌ Unauthorized - Check your API key');
            }
            else if (err.status === 429) {
                console.error('❌ Rate limited - Too many requests');
            }
            else if (err.status === 500) {
                console.error('❌ OpenAI server error');
            }
            this.handleError(err, 'Chat completion generation');
        }
    }
    /**
     * Generate a streaming chat completion using OpenAI GPT-4o-mini
     */
    async generateStreamingChatCompletion(messages, options = {}) {
        try {
            const { model = this.defaultModel, maxTokens = this.maxTokens, temperature = this.temperature } = options;
            // Validate messages format
            this.validateInput({ messages }, ['messages']);
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error('Messages must be a non-empty array');
            }
            // Ensure messages have proper format
            const validMessages = messages.map(msg => {
                if (!msg.role || !msg.content) {
                    throw new Error('Each message must have role and content properties');
                }
                return {
                    role: msg.role,
                    content: msg.content
                };
            });
            const stream = await this.openai.chat.completions.create({
                model,
                messages: validMessages,
                max_tokens: maxTokens,
                temperature,
                stream: true
            });
            return stream;
        }
        catch (error) {
            this.handleError(error, 'Streaming chat completion generation');
        }
    }
    /**
     * Generate a chat response with conversation management
     */
    async generateResponse(userMessage, conversationHistory = [], options = {}) {
        try {
            // Validate input
            this.validateInput({ userMessage }, ['userMessage']);
            // Build the conversation context
            const messages = [
                {
                    role: 'system',
                    content: options.systemPrompt || 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and engaging responses to help users with their questions and tasks.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: userMessage
                }
            ];
            const result = await this.generateChatCompletion(messages, options);
            return result.message;
        }
        catch (error) {
            this.handleError(error, 'Response generation');
        }
    }
    /**
     * Start a new chat session
     */
    async startSession(metadata = {}) {
        try {
            if (this.repository) {
                return await this.repository.createSession(metadata);
            }
            // Return a simple session object if no repository
            return {
                id: `session-${Date.now()}`,
                ...metadata,
                createdAt: new Date(),
                lastActivity: new Date(),
                messageCount: 0
            };
        }
        catch (error) {
            this.handleError(error, 'Session creation');
        }
    }
    /**
     * Save conversation message
     */
    async saveMessage(sessionId, message) {
        try {
            if (this.repository) {
                await this.repository.updateSessionActivity(sessionId);
                return await this.repository.saveMessage(sessionId, message);
            }
            return message;
        }
        catch (error) {
            this.handleError(error, 'Message saving');
        }
    }
    /**
     * Get conversation history
     */
    async getConversationHistory(sessionId) {
        try {
            if (this.repository) {
                return await this.repository.getConversation(sessionId);
            }
            return [];
        }
        catch (error) {
            this.handleError(error, 'Conversation history retrieval');
        }
    }
    /**
     * Validate conversation history format
     */
    validateConversationHistory(history) {
        if (!Array.isArray(history)) {
            return false;
        }
        return history.every(msg => msg &&
            typeof msg === 'object' &&
            msg.role &&
            msg.content &&
            ['user', 'assistant', 'system'].includes(msg.role));
    }
    /**
     * Trim conversation history to stay within token limits
     */
    trimConversationHistory(history, maxMessages = 20) {
        if (!Array.isArray(history) || history.length <= maxMessages) {
            return history;
        }
        // Keep the most recent messages
        return history.slice(-maxMessages);
    }
    /**
     * Handle OpenAI specific errors
     */
    handleError(error, operation = 'Operation') {
        console.error(`${operation} failed:`, error);
        // Handle specific OpenAI errors
        if (error.status === 401) {
            throw new Error('Invalid OpenAI API key');
        }
        else if (error.status === 429) {
            throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        else if (error.status === 400) {
            throw new Error('Invalid request to OpenAI API: ' + error.message);
        }
        else if (error.status >= 500) {
            throw new Error('OpenAI API service unavailable. Please try again later.');
        }
        throw new Error(`${operation} failed: ${error.message}`);
    }
}
