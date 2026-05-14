import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SuspendedPage from './Suspended';
import '../../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuspendedPage />
  </StrictMode>
);
