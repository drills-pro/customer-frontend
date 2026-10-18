import type { TenantTemplate } from '../tenant/derive';
export const TENANTS: Record<string, TenantTemplate | null> = {
  'drills.pro': null,
  'Acme Logistics': { tenant: 'acme', light: { background: '#FFFFFF', primary: '#2563EB', secondary: '#0EA5E9', warning: '#F59E0B', 'font-color': '#111827' }, dark: { background: '#0B1220', primary: '#3B82F6', secondary: '#22D3EE', warning: '#FBBF24', 'font-color': '#E5E7EB' } },
  'Green Farm Co': { tenant: 'farm', light: { background: '#F4F7F0', primary: '#2F7D32', secondary: '#8D6E63', warning: '#E6A100', 'font-color': '#1B2B1C' }, dark: { background: '#101A11', primary: '#66BB6A', secondary: '#BCAAA4', warning: '#FFCA28', 'font-color': '#EEF5EA' } },
};
