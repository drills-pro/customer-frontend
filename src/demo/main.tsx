import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DrillsProvider } from '../provider';
import { App } from './App';
import { TENANTS } from './tenants';

const q = new URLSearchParams(location.search);
function Root() {
  const [name, setName] = useState(q.get('tenant') ?? 'drills.pro');
  return (
    <DrillsProvider tenant={TENANTS[name] ?? null} defaultColorMode={(q.get('mode') as 'light' | 'dark') ?? 'system'}>
      <App tenantName={name} onTenant={setName} />
    </DrillsProvider>
  );
}
createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
