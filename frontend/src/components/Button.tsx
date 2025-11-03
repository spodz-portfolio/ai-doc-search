import React from 'react';
import './Button.css';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  title,
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className} ${disabled || loading ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="spinner"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};