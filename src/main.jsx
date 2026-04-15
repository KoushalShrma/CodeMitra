import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './hooks/useTheme';
import { ClerkProviderCompat } from './lib/clerkCompat';
import './styles/globals.css';

if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WDYR === 'true') {
  const whyDidYouRender = await import('@welldone-software/why-did-you-render');
  whyDidYouRender.default(React, { trackAllPureComponents: true });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ClerkProviderCompat enables zero-config demo mode when Clerk is disabled. */}
    <ClerkProviderCompat>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProviderCompat>
  </React.StrictMode>
);
