import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import './fonts';
import { system } from './theme';
import { ColorModeProvider } from '@/components/color-mode';
import { Toaster } from '@/components/toaster';
import { TenantTheme } from '@/tenant/TenantTheme';
import type { TenantTemplate } from '@/tenant/derive';

export interface DrillsProviderProps {
  children: ReactNode;
  /** A tenant's five-color template (light and dark). Omit for drills.pro itself. */
  tenant?: TenantTemplate | null;
  /** "system" follows the OS; "light" or "dark" to start fixed. */
  defaultColorMode?: 'system' | 'light' | 'dark';
  /** Force a mode, e.g. "light" on printed or embedded pages. */
  forcedColorMode?: 'light' | 'dark';
}

export function DrillsProvider({ children, tenant, defaultColorMode = 'system', forcedColorMode }: DrillsProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme={defaultColorMode} enableSystem forcedTheme={forcedColorMode}>
        <TenantTheme template={tenant}>
          {children}
          <Toaster />
        </TenantTheme>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
