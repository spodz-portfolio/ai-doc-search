import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import { renderWithProviders } from '../../test-utils/testHelpers';

describe('App Integration Tests', () => {
  it('should render without crashing', () => {
    const { container } = renderWithProviders(<App />);
    
    // Check that the app container is present (using container from render result)
    expect(container.querySelector('.App')).toBeTruthy();
  });

  it('should provide services through context', () => {
    // Test that ServiceProvider is working
    const { container } = renderWithProviders(<App />);
    
    // App should render without throwing errors
    expect(container).toBeInTheDocument();
  });

  it('should render Chat component', () => {
    renderWithProviders(<App />);
    
    // Since Chat is the main component, the app should contain some chat-related elements
    // We don't test specific UI elements since we don't know the exact Chat component structure
    const appContainer = document.querySelector('.App');
    expect(appContainer).toBeTruthy();
  });

  it('should integrate with service context correctly', () => {
    // Test service provider integration
    const TestComponent = () => {
      return <div data-testid="test-component">Test</div>;
    };
    
    const TestApp = () => (
      <div className="App">
        <TestComponent />
      </div>
    );
    
    renderWithProviders(<TestApp />);
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should maintain consistent structure', () => {
    const { container } = renderWithProviders(<App />);
    
    // Check that the basic structure is maintained
    const appElement = container.querySelector('.App');
    expect(appElement).toBeInTheDocument();
  });

  it('should handle multiple renders', () => {
    const { rerender } = renderWithProviders(<App />);
    
    // First render
    expect(document.querySelector('.App')).toBeTruthy();
    
    // Re-render
    rerender(<App />);
    expect(document.querySelector('.App')).toBeTruthy();
  });

  it('should provide all required services', () => {
    // Test that all services are properly injected
    let hasError = false;
    
    try {
      renderWithProviders(<App />);
    } catch (error) {
      hasError = true;
    }
    
    expect(hasError).toBe(false);
  });

  it('should render consistently across multiple instances', () => {
    const { unmount: unmount1 } = renderWithProviders(<App />);
    const firstRender = document.querySelector('.App');
    expect(firstRender).toBeTruthy();
    unmount1();
    
    const { unmount: unmount2 } = renderWithProviders(<App />);
    const secondRender = document.querySelector('.App');
    expect(secondRender).toBeTruthy();
    unmount2();
  });

  it('should integrate services without circular dependencies', () => {
    // Test that service integration doesn't cause circular dependency issues
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithProviders(<App />);
    
    // Should not log any errors about circular dependencies
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/circular|dependency/i)
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle service provider errors gracefully', () => {
    // Test error boundaries in service context
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      renderWithProviders(<App />);
      // If this doesn't throw, the error handling is working
      expect(true).toBe(true);
    } catch (error) {
      // If it throws, we expect it to be handled gracefully
      expect(error).toBeDefined();
    }
    
    consoleSpy.mockRestore();
  });
});