import { Request, Response } from 'express';
import { BaseController } from '../utils/BaseController.js';
/**
 * Controller for handling chat-related endpoints
 */
export declare class ChatController extends BaseController {
    private chatRepository;
    private chatService;
    constructor();
    /**
     * Handle regular chat completion
     */
    chat: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Handle streaming chat completion
     */
    chatStream: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Start a new chat session
     */
    startSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get conversation history
     */
    getHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get all chat sessions
     */
    getSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Delete a conversation
     */
    deleteConversation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Health check endpoint
     */
    health: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
