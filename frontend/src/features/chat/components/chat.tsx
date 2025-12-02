import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, RagMessage } from '../../../types/chat';
import { ragAPI, RagRequest } from '../../../services/ragAPI';
import Message from '../../../components/Message';
import DocumentUploadModal from '../../../components/DocumentUploadModal';
import '../../../components/Chat.css';

const Chat: React.FC = () => {
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState<any>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predefined categories (should match the upload modal)
  const predefinedCategories = [
    'Work', 'Personal', 'Research', 'Education', 
    'Legal', 'Finance', 'Health', 'Projects'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check status on initial load
    checkRagStatus();
  }, []);

  const checkRagStatus = async () => {
    try {
      const response = await ragAPI.getStatus();
      console.log('📊 RAG Status Response:', response);
      console.log('📊 RAG Status Response Structure:', JSON.stringify(response, null, 2));
      
      // Handle BaseController response structure: {success, message, data}
      const responseData = (response as any).data || response;
      console.log('📊 Extracted Response Data:', responseData);
      
      // The actual status data is in response.data
      setRagStatus(responseData);
    } catch (error) {
      console.error('❌ Failed to get RAG status:', error);
      setRagStatus(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      await handleRagResponse(userMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRagResponse = async (userMessage: ChatMessage) => {
    if (!ragStatus?.initialized) {
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'RAG system is not initialized. Please initialize and load documents first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const ragRequest: RagRequest = {
      query: userMessage.content,
      topK: 10,
      minSimilarity: 0.2,
      includeContext: true,
      maxContextLength: 4000,
      temperature: 0.7,
      maxTokens: 1000,
      category: selectedCategory || undefined, // Add category filter if selected
    };

    const response = await ragAPI.queryDocuments(ragRequest);

    const assistantMessage: RagMessage = {
      id: generateUniqueId(),
      role: 'assistant',
      content: response.success 
        ? response.data?.answer || response.answer || 'No answer found.'
        : response.message || 'RAG search failed.',
      timestamp: new Date(),
      sources: response.data?.sources || response.sources || [],
      retrievedChunks: response.data?.retrievedChunks || response.retrievedChunks || 0
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleUploadSuccess = () => {
    console.log('📤 Upload success callback triggered');
    
    // Set RAG status to initialized immediately for better UX
    setRagStatus((prev: any) => ({
      ...prev,
      initialized: true
    }));
    
    // Refresh from API to get accurate counts - give backend a moment to update
    setTimeout(() => {
      console.log('🔄 Refreshing RAG status after upload...');
      checkRagStatus();
    }, 500);
  };

  const handleInitializeRAG = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await ragAPI.initialize();
      console.log('🔧 Initialize Response:', response);
      
      // Set initial status (only initialization, no documents yet)
      setRagStatus({ initialized: true, documentsLoaded: 0, totalChunks: 0 });
      alert('RAG system initialized successfully! You can now upload documents.');
      
    } catch (error: any) {
      alert(`Error initializing RAG: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>📄 AI Document Search</h1>
        <p>Search through your personal documents using RAG technology</p>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          <button onClick={handleInitializeRAG} disabled={isLoadingDocs}>
            {isLoadingDocs ? '⏳' : '🔧'} Initialize RAG
          </button>
          <button onClick={clearChat} disabled={messages.length === 0}>
            🗑️ Clear Chat
          </button>
          <button onClick={() => setIsUploadModalOpen(true)}>
            📎 Upload Documents
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="status-info">
          <div>
            Status: {ragStatus?.initialized ? `✅ Ready (${ragStatus.documentsLoaded || 0} docs, ${ragStatus.totalChunks || 0} chunks)` : '❌ Not initialized'}
            {selectedCategory && (
              <span className="category-badge">
                📁 {selectedCategory}
              </span>
            )}
            <button 
              onClick={checkRagStatus} 
              style={{
                marginLeft: '1rem', 
                padding: '0.25rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'rgba(100, 255, 218, 0.2)',
                border: '1px solid rgba(100, 255, 218, 0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          {/* Debug info - remove in production */}
          <small style={{opacity: 0.7}}>
            Debug: {JSON.stringify({initialized: ragStatus?.initialized, docs: ragStatus?.documentsLoaded, chunks: ragStatus?.totalChunks})}
          </small>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="query-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isLoading}
              className="category-filter"
            >
              <option value="">🔍 All Categories</option>
              {predefinedCategories.map(category => (
                <option key={category} value={category}>
                  📁 {category}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="category-badge">
                📁 Searching in: <span className="category-name">{selectedCategory}</span>
                <button 
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="clear-category"
                  title="Clear category filter"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="input-row">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedCategory 
                ? `Ask about your ${selectedCategory} documents...` 
                : "Ask about your documents..."
              }
              disabled={isLoading}
              rows={3}
            />
            <button type="submit" disabled={!inputMessage.trim() || isLoading}>
              {isLoading ? '⏳' : '📤'} Send
            </button>
          </div>
        </form>
      </div>

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Chat;