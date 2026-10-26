import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { STORAGE_KEY, getBackend } from './storage.js';
import { createStore } from './store.js';

const store = createStore({ backend: getBackend() });

// Game mở ở nhiều tab: tab khác ghi hoặc xóa dữ liệu thì tab này đọc lại.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || e.key === null) store.actions.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
