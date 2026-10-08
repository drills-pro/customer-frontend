import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentDataset } from './use-current-dataset'

export function HealthCard({ onReview }: { onReview: () => void }) {
  const checks = useCurrentDataset().detail.healthChecks
  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle>Health check</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ul className="grid gap-3">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-sm">
              {check.status === 'pass' ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              )}
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" className="mt-1 w-full" onClick={onReview}>
          Review issues
        </Button>
      </CardContent>
    </Card>
  )
}
