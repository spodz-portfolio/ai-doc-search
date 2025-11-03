import { BaseRepository } from '../utils/BaseRepository.js';
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}
interface ChatMessageRecord extends ChatMessage {
    id: string;
    sessionId: string;
    timestamp: Date;
}
interface ChatSession {
    id: string;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
    [key: string]: any;
}
/**
 * Repository for managing OpenAI chat conversations and sessions
 */
export declare class ChatRepository extends BaseRepository<ChatMessageRecord> {
    private conversations;
    private sessions;
    constructor();
    /**
     * Save conversation message
     */
    saveMessage(sessionId: string, message: ChatMessage): Promise<ChatMessageRecord>;
    /**
     * Get conversation history
     */
    getConversation(sessionId: string): Promise<ChatMessageRecord[]>;
    /**
     * Create new chat session
     */
    createSession(metadata?: Record<string, any>): Promise<ChatSession>;
    /**
     * Update session activity
     */
    updateSessionActivity(sessionId: string): Promise<ChatSession | null>;
    /**
     * Get all sessions
     */
    getAllSessions(): Promise<ChatSession[]>;
    /**
     * Delete conversation
     */
    deleteConversation(sessionId: string): Promise<boolean>;
    /**
     * Clear old conversations (older than days)
     */
    cleanupOldConversations(days?: number): Promise<number>;
}
export {};
