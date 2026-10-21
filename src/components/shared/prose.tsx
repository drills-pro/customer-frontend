import { chakra } from '@chakra-ui/react';

/**
 * Typography for rendered Markdown (READMEs): headings, lists, code, tables
 * and quotes in the app's tokens. Elements inside are unstyled otherwise.
 */
export const Prose = chakra('div', {
  base: {
    color: 'fg',
    textStyle: 'body-sm',
    wordBreak: 'break-word',
    '& :where(h1, h2, h3, h4)': {
      fontWeight: 'semibold',
      lineHeight: '1.3',
      mt: '6',
      mb: '2',
    },
    '& :where(h1)': { fontSize: 'xl' },
    '& :where(h2)': {
      fontSize: 'lg',
      pb: '1.5',
      borderBottomWidth: '1px',
      borderColor: 'border',
    },
    '& :where(h3)': { fontSize: 'md' },
    '& :where(h4)': { fontSize: 'sm' },
    '& > :where(:first-child)': { mt: '0' },
    '& :where(p, ul, ol, pre, table, blockquote)': { mb: '3' },
    '& :where(ul)': { listStyleType: 'disc', ps: '5' },
    '& :where(ol)': { listStyleType: 'decimal', ps: '5' },
    '& :where(li)': { my: '1' },
    '& :where(a)': { color: 'brand-text', textDecoration: 'underline' },
    '& :where(strong)': { fontWeight: 'semibold' },
    '& :where(code)': {
      fontFamily: 'mono',
      fontSize: '0.875em',
      px: '1',
      py: '0.5',
      rounded: 'l1',
      bg: 'bg.muted',
    },
    '& :where(pre)': {
      fontFamily: 'mono',
      fontSize: 'xs',
      lineHeight: '1.25rem',
      p: '4',
      rounded: 'l3',
      bg: 'night',
      color: 'on-night',
      overflowX: 'auto',
    },
    '& :where(pre code)': { p: '0', bg: 'transparent', fontSize: 'inherit' },
    '& :where(blockquote)': {
      ps: '4',
      borderStartWidth: '3px',
      borderColor: 'border.emphasized',
      color: 'fg.muted',
    },
    '& :where(table)': { w: 'full', borderCollapse: 'collapse' },
    '& :where(th, td)': {
      textAlign: 'start',
      px: '3',
      py: '2',
      borderBottomWidth: '1px',
      borderColor: 'border',
    },
    '& :where(th)': { fontWeight: 'semibold' },
    '& :where(hr)': { my: '6', borderColor: 'border' },
  },
});
