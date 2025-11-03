import React from 'react';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  isConnected: boolean | null;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  className = '' 
}) => {
  const getStatusClass = () => {
    if (isConnected === null) return 'checking';
    return isConnected ? 'connected' : 'disconnected';
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Checking...';
    return isConnected ? 'Connected' : 'Offline';
  };

  return (
    <div className={`connection-status ${getStatusClass()} ${className}`}>
      <span className="status-dot"></span>
      {getStatusText()}
    </div>
  );
};