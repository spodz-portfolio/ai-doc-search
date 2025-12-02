import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store/store';
import { ServiceProvider } from './contexts/ServiceContext';
import { ErrorBoundary } from './shared/components/feedback/ErrorBoundary';
import Chat from './features/chat/components/chat';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ServiceProvider>
        <div className="App">
          <ErrorBoundary>
            <Chat />
          </ErrorBoundary>
        </div>
      </ServiceProvider>
    </Provider>
  );
}

export default App;
