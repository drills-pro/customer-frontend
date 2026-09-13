import { toast } from 'sonner'

/** Every placeholder destination in the shell reports itself the same way. */
export function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}
