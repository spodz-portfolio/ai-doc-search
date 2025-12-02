import { useState, useEffect, useCallback } from 'react';
import { IRagService } from '../types/interfaces';

export const useConnection = (ragService: IRagService) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [ragStatus, setRagStatus] = useState<any>(null);

  const checkConnection = useCallback(async () => {
    try {
      // Simple connection check - try to get RAG status
      const response = await ragService.getStatus();
      setIsConnected(true);
    } catch (error) {
      console.warn('Connection check failed:', error);
      setIsConnected(false);
    }
  }, [ragService]);
   
  const checkRagStatus = useCallback(async () => {
    try {
      const response = await ragService.getStatus();
      console.log('🔍 RAG Status Response from backend:', response);
      setRagStatus(response.status || response.data?.status);
    } catch (error) {
      console.warn('RAG service not available:', error);
      setRagStatus(null);
    }
  }, [ragService]);

  const refreshRagStatus = useCallback(async () => {
    console.log('🔄 Manually refreshing RAG status...');
    await checkRagStatus();
  }, [checkRagStatus]);

  const updateRagStatusAfterSuccess = useCallback((result: any) => {
    console.log('📊 Full result object:', result);
    
    // Handle different possible response structures
    const documents = result.documents || result.data?.documents || [];
    const totalChunks = documents.reduce((sum: number, doc: any) => 
      sum + (doc.chunkCount || doc.chunks || 0), 0) || 0;
    
    // Always set to initialized if we got a success response
    const newStatus = {
      initialized: true,
      documentsLoaded: documents.length,
      totalChunks: totalChunks
    };
    
    console.log('📊 Updating RAG status locally after successful document load:', newStatus);
    setRagStatus(newStatus);
  }, []);

  useEffect(() => {
    checkConnection();
    checkRagStatus();
  }, [checkConnection, checkRagStatus]);

  return {
    isConnected,
    ragStatus,
    checkConnection,
    refreshRagStatus,
    updateRagStatusAfterSuccess,
  };
};