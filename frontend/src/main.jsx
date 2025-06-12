/**
 * Point d'entrée de l'application React.
 * Il importe les styles globaux et le composant principal App,
 * puis le rend dans l'élément racine du DOM.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
