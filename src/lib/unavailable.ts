import { toaster } from '@/components/toaster';

/** Every placeholder action in the demo reports itself the same way. */
export function unavailable(label: string) {
  toaster.create({
    type: 'info',
    title: `${label} is not available in this dashboard demo.`,
  });
}
