import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installHaptics } from './utils/haptics.js';
import './styles/global.css';

// The saved theme is applied by an inline script in index.html before the first paint.
installHaptics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
