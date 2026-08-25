import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <Toaster
        position='top-right'
        reverseOrder={false}
        gutter={12}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 3500,

          style: {
            background: 'rgba(15, 23, 42, 0.96)',
            color: '#ffffff',
            border: '1px solid rgba(45, 212, 191, 0.18)',
            borderRadius: '16px',
            padding: '14px 16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
            fontWeight: 600,
          },

          success: {
            iconTheme: {
              primary: '#14b8a6',
              secondary: '#ffffff',
            },
          },

          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <App />
    </>
  </React.StrictMode>
);
