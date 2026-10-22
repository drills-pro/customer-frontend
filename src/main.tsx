import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { LocaleProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import i18next, { ready } from '@/i18n';
import { AuthProvider } from '@/modules/auth';
import { PreviewThemeProvider } from '@/showcase/preview-theme';
import { queryClient, router } from '@/router';

function Root() {
  const { i18n } = useTranslation();
  return (
    <PreviewThemeProvider>
      <LocaleProvider locale={i18n.resolvedLanguage ?? 'en'}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AuthProvider>
      </LocaleProvider>
    </PreviewThemeProvider>
  );
}

// A failed locale chunk must not blank the app: fall back to bundled English.
void ready
  .catch(() => i18next.changeLanguage('en'))
  .then(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Root />
      </StrictMode>,
    ),
  );
