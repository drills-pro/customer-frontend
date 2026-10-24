import { IconButton, type IconButtonProps } from '@chakra-ui/react';
import { Moon, Sun } from 'pixelarticons/react';
import { ThemeProvider, useTheme, type ThemeProviderProps } from 'next-themes';

/** Class-based color mode (".light" / ".dark" on <html>), which Chakra's _light/_dark conditions read. */
export function ColorModeProvider(props: ThemeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />;
}

export function useColorMode() {
  const { theme, resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = (forcedTheme || resolvedTheme) === 'dark' ? 'dark' : 'light';
  return {
    colorMode,
    preference: theme ?? 'system',
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(colorMode === 'dark' ? 'light' : 'dark'),
  } as const;
}

export function useColorModeValue<T>(light: T, dark: T) {
  return useColorMode().colorMode === 'dark' ? dark : light;
}

export function ColorModeButton(props: Omit<IconButtonProps, 'aria-label'>) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton aria-label={colorMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleColorMode} {...props}>
      {colorMode === 'dark' ? <Sun width={16} height={16} /> : <Moon width={16} height={16} />}
    </IconButton>
  );
}
