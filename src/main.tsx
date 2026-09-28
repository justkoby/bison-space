import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/inter';
import './styles/global.css';
import App from './App';
import { initTheme } from './theme';

// Sync the module theme state with whatever the pre-paint script already applied.
initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
