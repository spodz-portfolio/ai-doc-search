import React, { useState } from 'react';
import { ChatMessage, RagMessage } from '../../../types/chat';
import { Button } from '../../../shared/components/ui/Button';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage | RagMessage;
  isStreaming?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming = false }) => {
  const [showSources, setShowSources] = useState(false);
  
  const isRagMessage = (msg: ChatMessage | RagMessage): msg is RagMessage => {
    return 'sources' in msg;
  };

  const ragMessage = isRagMessage(message) ? message : null;

  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.avatar}>
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.role}>
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className={styles.timestamp}>
            {message.timestamp.toLocaleTimeString()}
          </span>
          {ragMessage && ragMessage.retrievedChunks && (
            <span className={styles.chunksInfo}>
              📊 {ragMessage.retrievedChunks} chunks retrieved
            </span>
          )}
        </div>
        
        <div className={styles.messageText}>
          {message.isLoading || isStreaming ? (
            <div className={styles.loadingIndicator}>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles.loadingText}>AI is thinking...</span>
            </div>
          ) : (
            <div className={styles.messageBody}>
              {message.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              
              {ragMessage && ragMessage.sources && ragMessage.sources.length > 0 && (
                <div className={styles.ragSources}>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(!showSources)}
                    className={styles.sourcesToggle}
                  >
                    📚 Sources ({ragMessage.sources.length}) {showSources ? '▼' : '▶'}
                  </Button>
                  
                  {showSources && (
                    <div className={styles.sourcesList}>
                      {ragMessage.sources.map((source, index) => (
                        <div key={index} className={styles.sourceItem}>
                          <div className={styles.sourceHeader}>
                            <span className={styles.sourceTitle}>{source.documentTitle}</span>
                            <span className={styles.sourceSimilarity}>
                              {Math.round(source.similarity * 100)}% match
                            </span>
                          </div>
                          <div className={styles.sourcePreview}>{source.preview}</div>
                          {source.webViewLink && (
                            <a 
                              href={source.webViewLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.sourceLink}
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

export default MessageItem;