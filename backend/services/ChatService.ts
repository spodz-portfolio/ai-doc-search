import { BaseService } from '../utils/BaseService.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type { ChatRepository } from '../repositories/ChatRepository.js';

// Load environment variables
dotenv.config();

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
export class ChatService extends BaseService {
  private openai: OpenAI;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(chatRepository?: ChatRepository) {
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
  async generateChatCompletion(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatCompletionResult> {
    try {
      const {
        model = this.defaultModel,
        maxTokens = this.maxTokens,
        temperature = this.temperature
      } = options;

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

    } catch (error) {
      const err = error as any;
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
      } else if (err.status === 401) {
        console.error('❌ Unauthorized - Check your API key');
      } else if (err.status === 429) {
        console.error('❌ Rate limited - Too many requests');
      } else if (err.status === 500) {
        console.error('❌ OpenAI server error');
      }
      
      this.handleError(err, 'Chat completion generation');
    }
  }

  /**
   * Generate a streaming chat completion using OpenAI GPT-4o-mini
   */
  async generateStreamingChatCompletion(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    try {
      const {
        model = this.defaultModel,
        maxTokens = this.maxTokens,
        temperature = this.temperature
      } = options;

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

    } catch (error) {
      this.handleError(error as Error, 'Streaming chat completion generation');
    }
  }

  /**
   * Generate a chat response with conversation management
   */
  async generateResponse(userMessage: string, conversationHistory: ChatMessage[] = [], options: ChatCompletionOptions = {}): Promise<string> {
    try {
      // Validate input
      this.validateInput({ userMessage }, ['userMessage']);

      // Build the conversation context
      const messages: ChatMessage[] = [
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

    } catch (error) {
      this.handleError(error as Error, 'Response generation');
    }
  }

  /**
   * Start a new chat session
   */
  async startSession(metadata: Record<string, any> = {}): Promise<ChatSession> {
    try {
      if (this.repository) {
        return await (this.repository as ChatRepository).createSession(metadata);
      }
      
      // Return a simple session object if no repository
      return {
        id: `session-${Date.now()}`,
        ...metadata,
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0
      };
    } catch (error) {
      this.handleError(error as Error, 'Session creation');
    }
  }

  /**
   * Save conversation message
   */
  async saveMessage(sessionId: string, message: ChatMessage): Promise<any> {
    try {
      if (this.repository) {
        await (this.repository as ChatRepository).updateSessionActivity(sessionId);
        return await (this.repository as ChatRepository).saveMessage(sessionId, message);
      }
      return message;
    } catch (error) {
      this.handleError(error as Error, 'Message saving');
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      if (this.repository) {
        return await (this.repository as ChatRepository).getConversation(sessionId);
      }
      return [];
    } catch (error) {
      this.handleError(error as Error, 'Conversation history retrieval');
    }
  }

  /**
   * Validate conversation history format
   */
  validateConversationHistory(history: any[]): boolean {
    if (!Array.isArray(history)) {
      return false;
    }

    return history.every(msg => 
      msg && 
      typeof msg === 'object' && 
      msg.role && 
      msg.content &&
      ['user', 'assistant', 'system'].includes(msg.role)
    );
  }

  /**
   * Trim conversation history to stay within token limits
   */
  trimConversationHistory(history: ChatMessage[], maxMessages: number = 20): ChatMessage[] {
    if (!Array.isArray(history) || history.length <= maxMessages) {
      return history;
    }

    // Keep the most recent messages
    return history.slice(-maxMessages);
  }

  /**
   * Handle OpenAI specific errors
   */
  protected handleError(error: any, operation: string = 'Operation'): never {
    console.error(`${operation} failed:`, error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.status === 400) {
      throw new Error('Invalid request to OpenAI API: ' + error.message);
    } else if (error.status >= 500) {
      throw new Error('OpenAI API service unavailable. Please try again later.');
    }
    
    throw new Error(`${operation} failed: ${error.message}`);
  }
}