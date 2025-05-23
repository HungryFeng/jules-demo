import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider
import i18n from './lib/i18n'; // Import i18n configuration
import { I18nextProvider } from 'react-i18next'; // Import I18nextProvider
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </ThemeProvider>
  </StrictMode>
);
