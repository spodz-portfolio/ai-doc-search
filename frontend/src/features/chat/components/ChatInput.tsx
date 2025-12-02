import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { useAppSelector } from '../../../app/store/store';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAppLoading = useAppSelector(state => state.app.isLoading);

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isSending || disabled) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const isLoading = isSending || isAppLoading;
  const canSend = inputMessage.trim() && !isLoading && !disabled;

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? 'Connect to server to start chatting...' : 'Type your message... (Enter to send, Shift+Enter for new line)'}
          className={styles.textarea}
          disabled={disabled || isLoading}
          rows={1}
        />
        
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          loading={isLoading}
          size="icon"
          className={styles.sendButton}
          title="Send message"
        >
          <span className={styles.sendIcon}>↗</span>
        </Button>
      </div>
      
      {disabled && (
        <div className={styles.connectionWarning}>
          <span className={styles.warningIcon}>⚠️</span>
          Not connected to server. Please check your connection.
        </div>
      )}
    </div>
  );
};

export default ChatInput;