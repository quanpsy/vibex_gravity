
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Global Styles
import './index.css';
import './styles/components.css';
import 'leaflet/dist/leaflet.css';

import ErrorBoundary from './ErrorBoundary';

console.log('🚀 Starting vibeX application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Could not find root element!');
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Root element found, mounting React...');

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ React mount command issued');
} catch (err) {
  console.error('❌ Failed to mount React app:', err);
}
