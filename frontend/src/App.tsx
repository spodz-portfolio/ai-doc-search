import React from 'react';
import Chat from './components/Chat';
import { ServiceProvider } from './contexts/ServiceContext';
import './App.css';

function App() {
  return (
    <ServiceProvider>
      <div className="App">
        <Chat />
      </div>
    </ServiceProvider>
  );
}

export default App;
