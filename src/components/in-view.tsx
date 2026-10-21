import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

/**
 * Plays children's mount animation when they scroll into view instead of on page load. Charts animate when they mount,
 * so the children render hidden first (the layout is already right), then remount the moment they are visible.
 */
export function InView({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setSeen(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <Box ref={ref} visibility={seen ? 'visible' : 'hidden'}>
      <Box key={seen ? 'seen' : 'waiting'}>{children}</Box>
    </Box>
  );
}
