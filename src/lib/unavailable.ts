import { toast } from 'sonner'

/** Every placeholder action in the demo reports itself the same way. */
export function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}
