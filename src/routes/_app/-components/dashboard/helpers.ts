import { toast } from 'sonner'

export function showUnavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}
