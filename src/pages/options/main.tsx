import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OptionsPage from './Options';
import '../../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsPage />
  </StrictMode>
);
