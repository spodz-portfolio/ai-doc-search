import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI Assistant application', () => {
  render(<App />);
  // Use getAllByText since there are multiple "AI Assistant" elements
  const aiAssistantElements = screen.getAllByText(/AI Assistant/i);
  expect(aiAssistantElements.length).toBeGreaterThan(0);
  // Or test for a more specific element
  const appElement = screen.getByRole('heading', { name: /🤖 AI Assistant/i });
  expect(appElement).toBeInTheDocument();
});
