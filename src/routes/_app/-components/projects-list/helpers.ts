import { toast } from 'sonner'

export function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}
