import express, { Router } from 'express';
import { RagController } from '../controllers/RagController.js';

const router: Router = express.Router();
const ragController = new RagController();

// Initialize RAG system
router.post('/initialize', ragController.initialize);

// Document loading endpoints
router.post('/load/drive', ragController.loadFromDrive);
router.post('/load/docs', ragController.loadFromGoogleDocs);
router.post('/load/text', ragController.loadFromText);
router.post('/load/upload', ragController.uploadDocuments);

// Google Docs search endpoints
router.post('/search/docs', ragController.searchAndLoadGoogleDocs);

// File upload endpoints
router.get('/upload/formats', ragController.getSupportedFormats);

// Query endpoint
router.post('/query', ragController.query);

// Document management endpoints
router.get('/documents', ragController.getDocuments);
router.post('/documents/:documentId/search', ragController.searchInDocument);
router.delete('/documents/:documentId', ragController.removeDocument);
router.delete('/documents', ragController.clearDocuments);

// Status and statistics endpoints
router.get('/status', ragController.getStatus);
router.get('/stats', ragController.getStats);
router.get('/health', ragController.health);

export default router;