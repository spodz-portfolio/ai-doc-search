import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../../types/chat';
import { MessageItem } from './index';
import { LoadingSpinner } from '../../../shared/components/feedback/LoadingSpinner';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>Start a conversation</h3>
          <p>Ask questions about your documents or have a general chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messagesList}>
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message}
          />
        ))}
        
        {streamingMessage && (
          <MessageItem 
            message={streamingMessage}
            isStreaming
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;