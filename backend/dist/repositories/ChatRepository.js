import { BaseRepository } from '../utils/BaseRepository.js';
/**
 * Repository for managing OpenAI chat conversations and sessions
 */
export class ChatRepository extends BaseRepository {
    conversations;
    sessions;
    constructor() {
        super();
        this.conversations = new Map();
        this.sessions = new Map();
    }
    /**
     * Save conversation message
     */
    async saveMessage(sessionId, message) {
        if (!this.conversations.has(sessionId)) {
            this.conversations.set(sessionId, []);
        }
        const messageRecord = {
            id: this.generateId(),
            sessionId,
            ...message,
            timestamp: new Date()
        };
        this.conversations.get(sessionId).push(messageRecord);
        return messageRecord;
    }
    /**
     * Get conversation history
     */
    async getConversation(sessionId) {
        return this.conversations.get(sessionId) || [];
    }
    /**
     * Create new chat session
     */
    async createSession(metadata = {}) {
        const session = {
            id: this.generateId(),
            ...metadata,
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0
        };
        this.sessions.set(session.id, session);
        return session;
    }
    /**
     * Update session activity
     */
    async updateSessionActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            session.messageCount++;
            return session;
        }
        return null;
    }
    /**
     * Get all sessions
     */
    async getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Delete conversation
     */
    async deleteConversation(sessionId) {
        this.conversations.delete(sessionId);
        this.sessions.delete(sessionId);
        return true;
    }
    /**
     * Clear old conversations (older than days)
     */
    async cleanupOldConversations(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        let cleaned = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.lastActivity < cutoffDate) {
                this.conversations.delete(sessionId);
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        return cleaned;
    }
}
