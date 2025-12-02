import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../../types/chat';

// Chat state interface for RAG-only functionality
export interface ChatState {
  // Messages
  messages: ChatMessage[];
  
  // RAG status
  ragStatus: any;
}

const initialState: ChatState = {
  messages: [],
  ragStatus: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>) => {
      const { id, updates } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === id);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates };
      }
    },
    
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    
    clearMessages: (state) => {
      state.messages = [];
    },
    
    setRagStatus: (state, action: PayloadAction<any>) => {
      state.ragStatus = action.payload;
    },
  },
});

// Export actions
export const {
  addMessage,
  updateMessage,
  deleteMessage,
  clearMessages,
  setRagStatus,
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;