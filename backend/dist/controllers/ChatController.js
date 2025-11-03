import { BaseController } from '../utils/BaseController.js';
import { ChatService } from '../services/ChatService.js';
import { ChatRepository } from '../repositories/ChatRepository.js';
/**
 * Controller for handling chat-related endpoints
 */
export class ChatController extends BaseController {
    chatRepository;
    chatService;
    constructor() {
        super();
        this.chatRepository = new ChatRepository();
        this.chatService = new ChatService(this.chatRepository);
    }
    /**
     * Handle regular chat completion
     */
    chat = this.asyncHandler(async (req, res) => {
        const { message, conversationHistory = [], options = {} } = req.body;
        // Validate required fields
        const errors = this.validateRequired(req.body, ['message']);
        if (errors.length > 0) {
            return this.validationError(res, errors);
        }
        // Validate conversation history if provided
        if (conversationHistory.length > 0 && !this.chatService.validateConversationHistory(conversationHistory)) {
            return this.validationError(res, ['Invalid conversation history format']);
        }
        // Trim conversation history to prevent token limit issues
        const trimmedHistory = this.chatService.trimConversationHistory(conversationHistory);
        // Generate response
        const response = await this.chatService.generateResponse(message, trimmedHistory, options);
        // Save messages if session is provided
        if (options.sessionId) {
            await this.chatService.saveMessage(options.sessionId, { role: 'user', content: message });
            await this.chatService.saveMessage(options.sessionId, { role: 'assistant', content: response });
        }
        this.success(res, {
            response,
            sessionId: options.sessionId
        });
    });
    /**
     * Handle streaming chat completion
     */
    chatStream = this.asyncHandler(async (req, res) => {
        const { message, conversationHistory = [], options = {} } = req.body;
        // Validate required fields
        const errors = this.validateRequired(req.body, ['message']);
        if (errors.length > 0) {
            return this.validationError(res, errors);
        }
        // Validate conversation history if provided
        if (conversationHistory.length > 0 && !this.chatService.validateConversationHistory(conversationHistory)) {
            return this.validationError(res, ['Invalid conversation history format']);
        }
        // Trim conversation history to prevent token limit issues
        const trimmedHistory = this.chatService.trimConversationHistory(conversationHistory);
        // Build the conversation context
        const messages = [
            {
                role: 'system',
                content: options.systemPrompt || 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and engaging responses to help users with their questions and tasks.'
            },
            ...trimmedHistory,
            {
                role: 'user',
                content: message
            }
        ];
        // Set up streaming response (Server-Sent Events format)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        try {
            // Get streaming completion
            const stream = await this.chatService.generateStreamingChatCompletion(messages, options);
            let fullResponse = '';
            // Handle streaming data
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    // Send content chunk in SSE format
                    const sseData = JSON.stringify({
                        content: content,
                        done: false
                    });
                    res.write(`data: ${sseData}\n\n`);
                }
            }
            // Send completion signal
            const completionData = JSON.stringify({
                content: '',
                done: true
            });
            res.write(`data: ${completionData}\n\n`);
            // Save messages if session is provided
            if (options.sessionId) {
                await this.chatService.saveMessage(options.sessionId, { role: 'user', content: message });
                await this.chatService.saveMessage(options.sessionId, { role: 'assistant', content: fullResponse });
            }
            res.end();
        }
        catch (error) {
            console.error('Streaming error:', error);
            // Send error in SSE format
            const errorData = JSON.stringify({
                error: error.message,
                done: true
            });
            res.write(`data: ${errorData}\n\n`);
            res.end();
        }
    });
    /**
     * Start a new chat session
     */
    startSession = this.asyncHandler(async (req, res) => {
        const { metadata = {} } = req.body;
        const session = await this.chatService.startSession(metadata);
        this.success(res, {
            session
        }, 'Chat session created successfully');
    });
    /**
     * Get conversation history
     */
    getHistory = this.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        if (!sessionId) {
            return this.validationError(res, ['Session ID is required']);
        }
        const history = await this.chatService.getConversationHistory(sessionId);
        this.success(res, {
            sessionId,
            history,
            messageCount: history.length
        });
    });
    /**
     * Get all chat sessions
     */
    getSessions = this.asyncHandler(async (req, res) => {
        const sessions = await this.chatRepository.getAllSessions();
        this.success(res, {
            sessions,
            count: sessions.length
        });
    });
    /**
     * Delete a conversation
     */
    deleteConversation = this.asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        if (!sessionId) {
            return this.validationError(res, ['Session ID is required']);
        }
        await this.chatRepository.deleteConversation(sessionId);
        this.success(res, {}, 'Conversation deleted successfully');
    });
    /**
     * Health check endpoint
     */
    health = this.asyncHandler(async (req, res) => {
        this.success(res, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Chat Service'
        });
    });
}
