import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatOptions, RagMessage } from '../types/chat';
import { chatAPI } from '../services/chatAPI';
import { ragAPI, RagRequest } from '../services/ragAPI';
import Message from './Message';
import './Chat.css';

const Chat: React.FC = () => {
  // Unique ID generator to prevent duplicate keys
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [options, setOptions] = useState<ChatOptions>({
    enableStreaming: true,
    maxTokens: 1000,
    temperature: 0.7,
    searchMode: 'openai',
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [ragStatus, setRagStatus] = useState<any>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState('');
  const [googleDocsSearchQuery, setGoogleDocsSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    checkConnection();
    checkRagStatus();
    loadSupportedFormats();
  }, []);

  const loadSupportedFormats = async () => {
    try {
      const formats = await ragAPI.getSupportedFormats();
      setSupportedFormats(formats);
    } catch (error) {
      console.warn('Could not load supported formats:', error);
    }
  };

  const checkConnection = async () => {
    try {
      await chatAPI.generalHealthCheck();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      
      // Retry connection after 3 seconds
      setTimeout(() => {
        checkConnection();
      }, 3000);
    }
  };

  const checkRagStatus = async () => {
    try {
      const response = await ragAPI.getStatus();
      console.log('🔍 RAG Status Response from backend:', response);
      setRagStatus(response.status);
    } catch (error) {
      console.warn('RAG service not available:', error);
      setRagStatus(null);
    }
  };

  const handleRefreshRagStatus = async () => {
    console.log('🔄 Manually refreshing RAG status...');
    await checkRagStatus();
  };

  const updateRagStatusAfterSuccess = (result: any) => {
    console.log('📊 Full result object:', result);
    
    // Handle different possible response structures
    const documents = result.documents || result.data?.documents || [];
    const totalChunks = documents.reduce((sum: number, doc: any) => sum + (doc.chunkCount || doc.chunks || 0), 0) || 0;
    
    // Always set to initialized if we got a success response
    const newStatus = {
      initialized: true,
      documentsLoaded: documents.length,
      totalChunks: totalChunks
    };
    
    console.log('📊 Extracted documents:', documents);
    console.log('📊 Updating RAG status locally after successful document load:', newStatus);
    setRagStatus(newStatus);
    console.log('📊 RAG status should now show as initialized in UI');
  };

  const handleSendMessage = async () => {
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
      if (options.searchMode === 'rag') {
        await handleRagResponse(userMessage);
      } else {
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        if (options.enableStreaming) {
          await handleStreamingResponse(userMessage, conversationHistory);
        } else {
          await handleRegularResponse(userMessage, conversationHistory);
        }
      }
    } catch (error) {
      let errorContent = 'Sorry, I encountered an error. ';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorContent += 'Unable to connect to the backend server. Please make sure the backend is running on http://localhost:3001';
        } else {
          errorContent += error.message;
        }
      } else {
        errorContent += 'Unknown error occurred.';
      }
      
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Try to reconnect after an error
      setTimeout(checkConnection, 1000);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };

  const handleRagResponse = async (userMessage: ChatMessage) => {
    try {
      // Check if RAG system is available
      if (!ragStatus?.initialized) {
        const statusMessage = ragStatus === null 
          ? 'RAG system is not available. Please make sure the backend server is running and try again.'
          : 'RAG system is not initialized. Please upload some documents first or initialize the RAG system.';
        
        const errorMessage: ChatMessage = {
          id: generateUniqueId(),
          role: 'assistant',
          content: `❌ ${statusMessage}`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const ragRequest: RagRequest = {
        query: userMessage.content,
        topK: 10, // Increased to get more potential matches
        minSimilarity: 0.2, // Increased for better quality matches (was 0.15)
        includeContext: true,
        maxContextLength: 4000,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      };

      const response = await ragAPI.queryDocuments(ragRequest);
      
      console.log('📥 RAG Response received:', response);
      console.log('📥 Response answer:', response.answer);
      console.log('📥 Response success:', response.success);

      const assistantMessage: RagMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: response.success 
          ? response.data?.answer || response.answer || 'No answer found in documents.'
          : response.message || 'RAG search failed.',
        timestamp: new Date(),
        sources: response.data?.sources || response.sources || [],
        retrievedChunks: response.data?.retrievedChunks || response.retrievedChunks || 0,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Handle network errors or other issues
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: `❌ RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if the backend server is running.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleStreamingResponse = async (
    userMessage: ChatMessage,
    conversationHistory: any[]
  ) => {
    let assistantMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setStreamingMessage(assistantMessage);

    try {
      await chatAPI.sendMessageStream(
        {
          message: userMessage.content,
          conversationHistory,
          options: {
            maxTokens: options.maxTokens,
            temperature: options.temperature,
          },
        },
        (chunk) => {
          if (chunk.error) {
            throw new Error(chunk.error);
          }

          if (chunk.content) {
            assistantMessage.content += chunk.content;
            setStreamingMessage({ ...assistantMessage });
          }

          if (chunk.done) {
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingMessage(null);
          }
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const handleRegularResponse = async (
    userMessage: ChatMessage,
    conversationHistory: any[]
  ) => {
    const response = await chatAPI.sendMessage({
      message: userMessage.content,
      conversationHistory,
      options: {
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      },
    });

    const assistantMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'assistant',
      content: response.response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingMessage(null);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const handleLoadDocuments = async () => {
    if (!googleDriveFolderId.trim()) {
      alert('Please enter a Google Drive folder ID');
      return;
    }

    setIsLoadingDocs(true);
    try {
      // Initialize RAG system first
      await ragAPI.initialize();
      
      // Load documents from Google Drive
      const result = await ragAPI.loadFromGoogleDrive({
        folderId: googleDriveFolderId.trim(),
        maxDocs: 50
      });

      if (result.success) {
        alert(`Successfully loaded ${result.documents?.length || 0} documents!`);
        // Update RAG status immediately
        updateRagStatusAfterSuccess(result);
        // Skip automatic backend refresh to preserve initialized status
        console.log('📊 Skipping automatic backend refresh to preserve RAG initialized status');
      } else {
        alert(`Failed to load documents: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      alert(`Error loading documents: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleLoadAllGoogleDocs = async () => {
    setIsLoadingDocs(true);
    try {
      // Initialize RAG system first
      await ragAPI.initialize();
      
      // Load all Google Docs from account
      const result = await ragAPI.loadFromGoogleDocs({
        maxDocs: 100,
        includeShared: true
      });

      if (result.success) {
        alert(`Successfully loaded ${result.documents?.length || 0} Google Docs from your account!`);
        // Update RAG status immediately
        updateRagStatusAfterSuccess(result);
        // Skip automatic backend refresh to preserve initialized status
        console.log('📊 Skipping automatic backend refresh to preserve RAG initialized status');
      } else {
        alert(`Failed to load Google Docs: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error loading Google Docs:', error);
      alert(`Error loading Google Docs: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSearchGoogleDocs = async () => {
    if (!googleDocsSearchQuery.trim()) {
      alert('Please enter a search query for Google Docs');
      return;
    }

    setIsLoadingDocs(true);
    try {
      // Initialize RAG system first
      await ragAPI.initialize();
      
      // Search and load Google Docs
      const result = await ragAPI.searchAndLoadGoogleDocs({
        searchQuery: googleDocsSearchQuery.trim(),
        maxDocs: 50
      });

      if (result.success) {
        alert(`Successfully found and loaded ${result.documents?.length || 0} Google Docs matching "${googleDocsSearchQuery}"!`);
        // Update RAG status immediately
        updateRagStatusAfterSuccess(result);
        // Skip automatic backend refresh to preserve initialized status
        console.log('📊 Skipping automatic backend refresh to preserve RAG initialized status');
      } else {
        alert(`Failed to find Google Docs: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error searching Google Docs:', error);
      alert(`Error searching Google Docs: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setIsLoadingDocs(true);
    try {
      // Initialize RAG system first
      await ragAPI.initialize();
      
      // Upload and process files
      const result = await ragAPI.uploadDocuments(selectedFiles);

      if (result.success) {
        // Debug the result structure
        console.log('📁 File upload result:', result);
        
        // Use the original selectedFiles count for accurate display
        const fileCount = selectedFiles?.length || 0;
        const docCount = result.documents?.length || 0;
        
        alert(`Successfully uploaded and processed ${fileCount} files! (${docCount} documents created)`);
        
        // Update RAG status immediately
        updateRagStatusAfterSuccess(result);
        // Clear selected files
        setSelectedFiles(null);
        // Reset file input
        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Skip automatic backend refresh to preserve initialized status
        // Backend sync will happen on next page load or manual status check
        console.log('📊 Skipping automatic backend refresh to preserve RAG initialized status');
      } else {
        alert(`Failed to upload documents: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      alert(`Error uploading documents: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFiles(files);
  };

  const handleInitializeRAG = async () => {
    setIsLoadingDocs(true);
    try {
      await ragAPI.initialize();
      // Update RAG status immediately
      setRagStatus({
        initialized: true,
        documentsLoaded: 0,
        totalChunks: 0
      });
      // Skip automatic backend refresh to preserve initialized status
      console.log('📊 Skipping automatic backend refresh to preserve RAG initialized status');
      alert('RAG system initialized successfully!');
    } catch (error: any) {
      console.error('Error initializing RAG:', error);
      alert(`Error initializing RAG: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Left Column - Messages Only */}
      <div className="messages-column">
        <div className="messages-container">
          {messages.length === 0 && !streamingMessage && (
            <div className="welcome-message">
              <div className="welcome-content">
                <h2>Welcome to AI Assistant! 👋</h2>
                <p>I'm here to help you with questions, creative tasks, coding, and more.</p>
                <div className="example-prompts">
                  <p>Try asking me about:</p>
                  <ul>
                    <li>💡 Explaining complex topics</li>
                    <li>🎨 Creative writing and brainstorming</li>
                    <li>💻 Programming and technical help</li>
                    <li>📚 Research and analysis</li>
                  </ul>
                  
                  <div className="rag-note">
                    <p><strong>🔍 Search Modes:</strong></p>
                    <ul>
                      <li><strong>Public Search:</strong> Uses OpenAI's knowledge base</li>
                      <li><strong>Personal Docs:</strong> Searches your uploaded documents (PDFs, Google Docs, etc.) using RAG technology</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}

          {streamingMessage && (
            <Message key="streaming" message={streamingMessage} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Right Column - Controls (Everything Else) */}
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <h1>🤖 AI Assistant</h1>
            <div className={`connection-status ${isConnected === null ? 'checking' : isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
          
          <div className="chat-controls">
            <button 
              onClick={clearChat}
              className="clear-button"
              disabled={messages.length === 0 && !streamingMessage}
            >
              🗑️ Clear Chat
            </button>
          </div>
        </div>

        <div className="chat-settings">
          <div className="settings-row">
            <label>
              <input
                type="checkbox"
                checked={options.enableStreaming}
                onChange={(e) => setOptions(prev => ({ ...prev, enableStreaming: e.target.checked }))}
                disabled={options.searchMode === 'rag'}
              />
              Enable Streaming {options.searchMode === 'rag' && <small>(Not available for RAG)</small>}
            </label>

            <div className="slider-group">
              <label>
                Temperature: {options.temperature}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={options.temperature}
                  onChange={(e) => setOptions(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
              </label>
            </div>

            <div className="slider-group">
              <label>
                Max Tokens: {options.maxTokens}
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={options.maxTokens}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                />
              </label>
            </div>
          </div>

          {/* Document Loading Section */}
          <div className="settings-row document-loading-section">
            <div className="doc-loading-group">
              <label className="doc-loading-label">📄 Load Documents:</label>
              
              {/* Google Docs - All Documents */}
              <div className="doc-input-group">
                <button
                  onClick={handleLoadAllGoogleDocs}
                  disabled={isLoadingDocs}
                  className="load-docs-button primary"
                >
                  {isLoadingDocs ? '⏳ Loading...' : '📚 Load All My Google Docs'}
                </button>
                <small className="doc-help-text">
                  💡 Loads all Google Docs from your account (including shared docs)
                </small>
              </div>

              {/* Google Docs - Search */}
              <div className="doc-input-group">
                <input
                  type="text"
                  placeholder="Search Google Docs by name or content"
                  value={googleDocsSearchQuery}
                  onChange={(e) => setGoogleDocsSearchQuery(e.target.value)}
                  className="folder-id-input"
                  disabled={isLoadingDocs}
                />
                <button
                  onClick={handleSearchGoogleDocs}
                  disabled={isLoadingDocs || !googleDocsSearchQuery.trim()}
                  className="load-docs-button"
                >
                  {isLoadingDocs ? '⏳ Searching...' : '🔍 Search & Load'}
                </button>
              </div>

              {/* File Upload */}
              <div className="doc-input-group">
                <input
                  type="file"
                  id="document-upload"
                  multiple
                  accept=".txt,.pdf,.docx,.doc,.md,.json"
                  onChange={handleFileSelect}
                  className="file-input"
                  disabled={isLoadingDocs}
                />
                <button
                  onClick={handleFileUpload}
                  disabled={isLoadingDocs || !selectedFiles}
                  className="load-docs-button upload"
                >
                  {isLoadingDocs ? '⏳ Uploading...' : '📤 Upload & Process'}
                </button>
              </div>
              {selectedFiles && (
                <small className="doc-help-text">
                  📎 Selected: {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} 
                  ({Array.from(selectedFiles).map(f => f.name).join(', ')})
                </small>
              )}

              {/* Google Drive - Folder */}
              <div className="doc-input-group">
                <input
                  type="text"
                  placeholder="Enter Google Drive Folder ID (optional)"
                  value={googleDriveFolderId}
                  onChange={(e) => setGoogleDriveFolderId(e.target.value)}
                  className="folder-id-input"
                  disabled={isLoadingDocs}
                />
                <button
                  onClick={handleLoadDocuments}
                  disabled={isLoadingDocs || !googleDriveFolderId.trim()}
                  className="load-docs-button"
                >
                  {isLoadingDocs ? '⏳ Loading...' : '📁 Load from Folder'}
                </button>
              </div>

              <div className="doc-actions-group">
                <button
                  onClick={handleInitializeRAG}
                  disabled={isLoadingDocs}
                  className="init-rag-button"
                >
                  {isLoadingDocs ? '⏳' : '🔧'} Initialize RAG
                </button>
              </div>
              
              <small className="doc-help-text">
                💡 <strong>Supported files:</strong> .txt, .pdf, .docx, .doc, .md, .json (max 10MB each)<br/>
                💡 <strong>Google Drive:</strong> Get folder ID from URL: https://drive.google.com/drive/folders/<strong>FOLDER_ID</strong>
              </small>
            </div>
          </div>
        </div>

        <div className="input-container">
          <div className="input-card">
            <div className="search-mode-section">
              <div className="search-mode-group">
                <label className="search-mode-label">Search Mode:</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="searchMode"
                      value="openai"
                      checked={options.searchMode === 'openai'}
                      onChange={(e) => setOptions(prev => ({ ...prev, searchMode: e.target.value as 'openai' | 'rag' }))}
                    />
                    <span className="radio-text">🌐 Public Search (OpenAI)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="searchMode"
                      value="rag"
                      checked={options.searchMode === 'rag'}
                      onChange={(e) => setOptions(prev => ({ ...prev, searchMode: e.target.value as 'openai' | 'rag' }))}
                    />
                    <span className="radio-text">
                      📄 Personal Docs (RAG)
                      {ragStatus?.initialized ? (
                        <small className="rag-info" onClick={handleRefreshRagStatus} style={{cursor: 'pointer'}} title="Click to refresh status"> - ✅ {ragStatus.documentsLoaded} docs, {ragStatus.totalChunks} chunks 🔄</small>
                      ) : ragStatus === null ? (
                        <small className="rag-warning" onClick={handleRefreshRagStatus} style={{cursor: 'pointer'}} title="Click to retry connection"> - ⚠️ Backend offline 🔄</small>
                      ) : (
                        <small className="rag-disabled" onClick={handleRefreshRagStatus} style={{cursor: 'pointer'}} title="Click to check status"> - ❌ Not initialized 🔄</small>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={options.searchMode === 'rag' 
                  ? "Ask about your personal documents... (Press Enter to send, Shift+Enter for new line)"
                  : "Type your message... (Press Enter to send, Shift+Enter for new line)"
                }
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
                title={
                  !inputMessage.trim()
                    ? 'Enter a message first'
                    : isLoading
                    ? 'Sending message...'  
                    : !isConnected
                    ? 'Send anyway (backend may be offline)'
                    : options.searchMode === 'rag'
                    ? 'Search your documents'
                    : 'Send message'
                }
              >
                {isLoading ? '⏳' : options.searchMode === 'rag' ? '🔍' : '🚀'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;