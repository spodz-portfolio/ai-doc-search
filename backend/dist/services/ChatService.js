import { BaseService } from '../utils/BaseService.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * Simplified ChatService for RAG system OpenAI integration only
 * This service is used internally by RAG to generate responses from retrieved context
 */
export class ChatService extends BaseService {
    openai;
    defaultModel;
    maxTokens;
    temperature;
    constructor() {
        super();
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
     * Generate a response using OpenAI for RAG system
     * This is used internally by RAG to create answers from retrieved context
     */
    async generateResponse(userMessage, conversationHistory = [], options = {}) {
        try {
            // Validate input
            this.validateInput({ userMessage }, ['userMessage']);
            // Build the conversation context for RAG
            const messages = [
                {
                    role: 'system',
                    content: options.systemPrompt || 'You are a helpful AI assistant that answers questions based on the provided context. Use only the information from the context to answer questions. If the context doesn\'t contain enough information to answer the question, say so clearly.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: userMessage
                }
            ];
            const completion = await this.openai.chat.completions.create({
                model: options.model || this.defaultModel,
                messages: messages,
                max_tokens: options.maxTokens || this.maxTokens,
                temperature: options.temperature || this.temperature,
                stream: false
            });
            if (!completion || !completion.choices || completion.choices.length === 0) {
                throw new Error('Invalid response from OpenAI API - no choices returned');
            }
            const message = completion.choices[0]?.message?.content;
            if (!message) {
                throw new Error('No content returned from OpenAI API');
            }
            return message;
        }
        catch (error) {
            const err = error;
            console.error('❌ OpenAI API Error for RAG:', {
                message: err.message,
                status: err.status
            });
            // Provide specific error messages for RAG context
            if (err.status === 401) {
                throw new Error('OpenAI API authentication failed - check your API key');
            }
            else if (err.status === 429) {
                throw new Error('OpenAI API rate limit exceeded - please try again later');
            }
            else if (err.status === 400) {
                throw new Error('Invalid request to OpenAI API - check your input');
            }
            throw new Error(`OpenAI API error: ${err.message}`);
        }
    }
}
