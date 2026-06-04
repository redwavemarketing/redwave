import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts — the design-system's named examples (§4): humanist sans + tabular mono.
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
// Styles — order matters: reset → tokens → base.
import './styles/reset.css';
import './styles/theme.css';
import './styles/base.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
