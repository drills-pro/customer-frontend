import { IconButton, type IconButtonProps } from '@chakra-ui/react';
import { ThemeProvider, useTheme, type ThemeProviderProps } from 'next-themes';

/** Class-based color mode (".light" / ".dark" on <html>), which Chakra's _light/_dark conditions read. */
export function ColorModeProvider(props: ThemeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />;
}

export function useColorMode() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = (forcedTheme || resolvedTheme) === 'dark' ? 'dark' : 'light';
  return { colorMode, setColorMode: setTheme, toggleColorMode: () => setTheme(colorMode === 'dark' ? 'light' : 'dark') } as const;
}

export function useColorModeValue<T>(light: T, dark: T) {
  return useColorMode().colorMode === 'dark' ? dark : light;
}

const Sun = () => (<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></svg>);
const Moon = () => (<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" /></svg>);

export function ColorModeButton(props: Omit<IconButtonProps, 'aria-label'>) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton aria-label={colorMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleColorMode} {...props}>
      {colorMode === 'dark' ? <Sun /> : <Moon />}
    </IconButton>
  );
}
