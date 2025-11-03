import express, { Router } from 'express';
import { ChatController } from '../controllers/ChatController.js';

const router: Router = express.Router();
const chatController = new ChatController();

// Regular chat completion endpoint
router.post('/chat', chatController.chat);

// Streaming chat completion endpoint
router.post('/chat/stream', chatController.chatStream);

// Session management endpoints
router.post('/sessions', chatController.startSession);
router.get('/sessions', chatController.getSessions);
router.get('/sessions/:sessionId/history', chatController.getHistory);
router.delete('/sessions/:sessionId', chatController.deleteConversation);

// Health check
router.get('/health', chatController.health);

export default router;