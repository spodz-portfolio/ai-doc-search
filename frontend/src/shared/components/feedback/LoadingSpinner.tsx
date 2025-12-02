import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
}) => {
  const spinnerClass = [
    styles.spinner,
    styles[size],
    styles[color],
  ].join(' ');

  const content = (
    <div className={styles.container}>
      <div className={spinnerClass} />
      {text && <div className={styles.text}>{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className={styles.overlay}>
        {content}
      </div>
    );
  }

  return content;
};

export { LoadingSpinner };