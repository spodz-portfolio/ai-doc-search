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
  [key: string]: any; // For additional metadata
}

/**
 * Repository for managing OpenAI chat conversations and sessions
 */
export class ChatRepository extends BaseRepository<ChatMessageRecord> {
  private conversations: Map<string, ChatMessageRecord[]>;
  private sessions: Map<string, ChatSession>;

  constructor() {
    super();
    this.conversations = new Map();
    this.sessions = new Map();
  }

  /**
   * Save conversation message
   */
  async saveMessage(sessionId: string, message: ChatMessage): Promise<ChatMessageRecord> {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }

    const messageRecord: ChatMessageRecord = {
      id: this.generateId(),
      sessionId,
      ...message,
      timestamp: new Date()
    };

    this.conversations.get(sessionId)!.push(messageRecord);
    return messageRecord;
  }

  /**
   * Get conversation history
   */
  async getConversation(sessionId: string): Promise<ChatMessageRecord[]> {
    return this.conversations.get(sessionId) || [];
  }

  /**
   * Create new chat session
   */
  async createSession(metadata: Record<string, any> = {}): Promise<ChatSession> {
    const session: ChatSession = {
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
  async updateSessionActivity(sessionId: string): Promise<ChatSession | null> {
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
  async getAllSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values());
  }

  /**
   * Delete conversation
   */
  async deleteConversation(sessionId: string): Promise<boolean> {
    this.conversations.delete(sessionId);
    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Clear old conversations (older than days)
   */
  async cleanupOldConversations(days: number = 7): Promise<number> {
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