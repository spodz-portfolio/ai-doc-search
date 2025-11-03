import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { ServiceProvider } from '../../contexts/ServiceContext';

// Mock services for testing
export const mockChatService = {
  sendMessage: jest.fn(),
  sendMessageStream: jest.fn(),
  healthCheck: jest.fn(),
  getModels: jest.fn(),
  generalHealthCheck: jest.fn(),
};

export const mockRagService = {
  queryDocuments: jest.fn(),
  getStatus: jest.fn(),
  initialize: jest.fn(),
  uploadDocuments: jest.fn(),
  loadFromGoogleDocs: jest.fn(),
  loadFromGoogleDrive: jest.fn(),
  searchAndLoadGoogleDocs: jest.fn(),
  getSupportedFormats: jest.fn(),
};

export const mockMessageService = {
  generateUniqueId: jest.fn(() => 'test-id-123'),
  formatMessage: jest.fn((content: string) => content),
  formatTimeAgo: jest.fn(() => 'just now'),
  formatTime: jest.fn(() => '12:00 PM'),
};

export const mockUIService = {
  scrollToBottom: jest.fn(),
  adjustTextareaHeight: jest.fn(),
  debounce: jest.fn((fn: any) => fn),
  formatFileSize: jest.fn(() => '1 MB'),
  validateFileType: jest.fn(() => true),
  validateFileSize: jest.fn(() => true),
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withServices?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  { withServices = true, ...renderOptions }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (withServices) {
      return React.createElement(
        ServiceProvider,
        {
          chatService: mockChatService as any,
          ragService: mockRagService as any,
          messageService: mockMessageService as any,
          uiService: mockUIService as any,
          children: children
        }
      );
    }
    return React.createElement(React.Fragment, {}, children);
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Common test data
export const mockMessages = [
  {
    id: 'msg-1',
    role: 'user' as const,
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    isLoading: false,
  },
  {
    id: 'msg-2',
    role: 'assistant' as const,
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2024-01-01T12:01:00Z'),
    isLoading: false,
  },
];

export const mockRagMessage = {
  id: 'rag-msg-1',
  role: 'assistant' as const,
  content: 'Based on your documents, the answer is...',
  timestamp: new Date('2024-01-01T12:02:00Z'),
  isLoading: false,
  sources: [
    {
      documentId: 'doc-1',
      documentTitle: 'Test Document',
      chunkIndex: 0,
      similarity: 0.85,
      webViewLink: 'https://example.com/doc',
      preview: 'This is a preview of the document content...',
    },
  ],
  retrievedChunks: 1,
};

// Mock fetch for API tests
export const mockFetch = (response: any, ok: boolean = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: ok ? 200 : 400,
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null,
      },
    })
  ) as jest.Mock;
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  Object.values(mockChatService).forEach(mock => mock.mockReset());
  Object.values(mockRagService).forEach(mock => mock.mockReset());
  Object.values(mockMessageService).forEach(mock => mock.mockReset());
  Object.values(mockUIService).forEach(mock => mock.mockReset());
};