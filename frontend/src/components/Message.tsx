import React, { useState } from 'react';
import { ChatMessage, RagMessage } from '../types/chat';
import './Message.css';

interface MessageProps {
  message: ChatMessage | RagMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isRagMessage = (msg: ChatMessage | RagMessage): msg is RagMessage => {
    return 'sources' in msg || 'retrievedChunks' in msg;
  };

  const ragMessage = isRagMessage(message) ? message : null;

  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">
            {message.role === 'user' ? '👤 You' : ragMessage ? '📄 RAG Assistant' : '🤖 Assistant'}
          </span>
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
          {ragMessage && ragMessage.retrievedChunks && (
            <span className="rag-info">
              📊 {ragMessage.retrievedChunks} chunks retrieved
            </span>
          )}
        </div>
        <div className="message-text">
          {message.isLoading ? (
            <div className="loading-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="loading-text">AI is thinking...</span>
            </div>
          ) : (
            <div className="message-body">
              {message.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              
              {ragMessage && ragMessage.sources && ragMessage.sources.length > 0 && (
                <div className="rag-sources">
                  <button 
                    className="sources-toggle"
                    onClick={() => setShowSources(!showSources)}
                  >
                    📚 Sources ({ragMessage.sources.length}) {showSources ? '▼' : '▶'}
                  </button>
                  
                  {showSources && (
                    <div className="sources-list">
                      {ragMessage.sources.map((source, index) => (
                        <div key={index} className="source-item">
                          <div className="source-header">
                            <span className="source-title">{source.documentTitle}</span>
                            <span className="source-similarity">
                              {Math.round(source.similarity * 100)}% match
                            </span>
                          </div>
                          <div className="source-preview">{source.preview}</div>
                          {source.webViewLink && (
                            <a 
                              href={source.webViewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="source-link"
                            >
                              📄 View Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;