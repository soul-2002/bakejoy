// src/main.tsx (یا src/index.tsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // or your global styles
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // <-- Import AuthProvider
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'; // For MUI
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// Optional: Create a basic theme
const theme = createTheme({
  // Customize your theme here if needed
  direction: 'rtl', // Example for RTL
  typography: {
    fontFamily: 'Vazirmatn, Roboto, "Helvetica Neue", Arial, sans-serif', // Example font
  },
});
// ۲. ایجاد کش RTL برای استایل‌ها
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin], // فعال کردن پلاگین RTL
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
    <ThemeProvider theme={theme}> {/* Apply MUI Theme */}
      <CssBaseline /> {/* Normalize CSS */}
      <BrowserRouter>
        <AuthProvider> {/* Wrap App with AuthProvider */}
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>,
)