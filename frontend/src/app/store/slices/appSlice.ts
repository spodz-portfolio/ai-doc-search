import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// App state interface (same as Zustand version but without actions)
export interface AppState {
  // UI State
  isLoading: boolean;
  isConnected: boolean | null;
  currentTheme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Error handling
  error: string | null;
}

const initialState: AppState = {
  isLoading: false,
  isConnected: null,
  currentTheme: 'light',
  sidebarOpen: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setConnected: (state, action: PayloadAction<boolean | null>) => {
      state.isConnected = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.currentTheme = action.payload;
      // Note: localStorage side effect should be handled in middleware or component
      localStorage.setItem('theme', action.payload);
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  setLoading,
  setConnected,
  setTheme,
  toggleSidebar,
  setError,
  clearError,
} = appSlice.actions;

// Export reducer
export default appSlice.reducer;