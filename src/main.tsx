import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Brand fonts enhance the rendered store but must never block its first paint.
const fonts = document.createElement('link');
fonts.rel = 'stylesheet';
fonts.media = 'print';
fonts.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500;600&display=swap';
fonts.addEventListener('load', () => { fonts.media = 'all'; }, { once: true });
document.head.appendChild(fonts);
