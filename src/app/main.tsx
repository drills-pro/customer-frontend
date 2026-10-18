import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { LocaleProvider } from '@chakra-ui/react';
import { ready } from '../i18n';
import { DrillsProvider } from '../provider';
import { TENANTS } from '../demo/tenants';
import { AuthProvider, useAuth } from './auth';
import { CallbackPage, LoginPage, SignupPage } from './AuthPages';
import { Dashboard } from './Dashboard';
import { navigate, usePath } from './router';

const read = () => {
  try {
    return localStorage.getItem('drills-theme');
  } catch {
    return null;
  }
};

function Routes({ theme, onTheme }: { theme: string; onTheme: (n: string) => void }) {
  const path = usePath();
  const { user, loading } = useAuth();
  const isAuthPage = path === '/login' || path === '/signup';
  const target = path === '/auth/callback' || loading ? null : user ? (isAuthPage ? '/' : null) : isAuthPage ? null : '/login';

  useEffect(() => {
    if (target) navigate(target === '/login' && path !== '/' ? `/login?return_to=${encodeURIComponent(path + location.search)}` : target);
  }, [target, path]);

  if (path === '/auth/callback') return <CallbackPage />;
  if (loading || target) return null;
  if (path === '/signup') return <SignupPage />;
  if (path === '/login') return <LoginPage />;
  return <Dashboard theme={theme} onTheme={onTheme} />;
}

function Root() {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState(() => {
    const t = read();
    return t && t in TENANTS ? t : 'drills.pro';
  });
  const onTheme = (n: string) => {
    setTheme(n);
    try {
      localStorage.setItem('drills-theme', n);
    } catch {
      /* private mode */
    }
  };
  return (
    <DrillsProvider tenant={TENANTS[theme] ?? null}>
      <LocaleProvider locale={i18n.resolvedLanguage ?? 'en'}>
        <AuthProvider>
          <Routes theme={theme} onTheme={onTheme} />
        </AuthProvider>
      </LocaleProvider>
    </DrillsProvider>
  );
}

void ready.then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  ),
);
