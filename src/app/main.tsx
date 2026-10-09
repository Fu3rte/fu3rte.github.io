import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/style.css';
import { initI18n } from '../shared/i18n';
import { bootLoader } from '../shared/loader';
import App from './App';

bootLoader();
void initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode><App /></StrictMode>,
  );
});
