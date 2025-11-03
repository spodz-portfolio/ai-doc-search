import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../../components/ConnectionStatus';

describe('ConnectionStatus Component', () => {
  it('should show checking status when isConnected is null', () => {
    render(<ConnectionStatus isConnected={null} />);
    
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    const statusContainer = screen.getByText('Checking...').closest('.connection-status');
    expect(statusContainer).toHaveClass('connection-status', 'checking');
  });

  it('should show connected status when isConnected is true', () => {
    render(<ConnectionStatus isConnected={true} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    const statusContainer = screen.getByText('Connected').closest('.connection-status');
    expect(statusContainer).toHaveClass('connection-status', 'connected');
  });

  it('should show offline status when isConnected is false', () => {
    render(<ConnectionStatus isConnected={false} />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    const statusContainer = screen.getByText('Offline').closest('.connection-status');
    expect(statusContainer).toHaveClass('connection-status', 'disconnected');
  });

  it('should apply custom className', () => {
    render(<ConnectionStatus isConnected={true} className="custom-status" />);
    
    const statusContainer = screen.getByText('Connected').closest('.connection-status');
    expect(statusContainer).toHaveClass('connection-status', 'connected', 'custom-status');
  });

  it('should render status dot for each state', () => {
    const { rerender } = render(<ConnectionStatus isConnected={null} />);
    
    let statusContainer = screen.getByText('Checking...').closest('.connection-status');
    let statusDot = statusContainer?.querySelector('.status-dot');
    expect(statusDot).toBeInTheDocument();
    
    rerender(<ConnectionStatus isConnected={true} />);
    statusContainer = screen.getByText('Connected').closest('.connection-status');
    statusDot = statusContainer?.querySelector('.status-dot');
    expect(statusDot).toBeInTheDocument();
    
    rerender(<ConnectionStatus isConnected={false} />);
    statusContainer = screen.getByText('Offline').closest('.connection-status');
    statusDot = statusContainer?.querySelector('.status-dot');
    expect(statusDot).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    render(<ConnectionStatus isConnected={true} />);
    
    const container = screen.getByText('Connected').closest('.connection-status');
    expect(container).toHaveClass('connection-status');
    
    const statusDot = container?.querySelector('.status-dot');
    expect(statusDot).toBeInTheDocument();
    expect(statusDot).toHaveClass('status-dot');
  });

  it('should handle all connection states correctly', () => {
    // Checking state (null)
    const { rerender } = render(<ConnectionStatus isConnected={null} />);
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(screen.getByText('Checking...').closest('.connection-status')).toHaveClass('checking');
    
    // Connected state (true)
    rerender(<ConnectionStatus isConnected={true} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Connected').closest('.connection-status')).toHaveClass('connected');
    
    // Disconnected state (false)
    rerender(<ConnectionStatus isConnected={false} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Offline').closest('.connection-status')).toHaveClass('disconnected');
  });

  it('should combine className properly when provided', () => {
    render(<ConnectionStatus isConnected={true} className="extra-class another-class" />);
    
    const statusContainer = screen.getByText('Connected').closest('.connection-status');
    expect(statusContainer).toHaveClass(
      'connection-status',
      'connected',
      'extra-class',
      'another-class'
    );
  });

  it('should work without className prop', () => {
    render(<ConnectionStatus isConnected={false} />);
    
    const statusContainer = screen.getByText('Offline').closest('.connection-status');
    expect(statusContainer).toHaveClass('connection-status', 'disconnected');
    expect(statusContainer?.className).not.toContain('undefined');
  });

  it('should maintain consistent structure across all states', () => {
    const states = [
      { isConnected: null, expectedText: 'Checking...', expectedClass: 'checking' },
      { isConnected: true, expectedText: 'Connected', expectedClass: 'connected' },
      { isConnected: false, expectedText: 'Offline', expectedClass: 'disconnected' }
    ];
    
    states.forEach(({ isConnected, expectedText, expectedClass }) => {
      const { unmount } = render(<ConnectionStatus isConnected={isConnected} />);
      
      const statusContainer = screen.getByText(expectedText).closest('.connection-status');
      expect(statusContainer).toHaveClass('connection-status', expectedClass);
      expect(statusContainer?.querySelector('.status-dot')).toBeInTheDocument();
      
      unmount();
    });
  });
});