import * as React from 'react'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TrainingRun } from '@/features/dashboard/data'

import { downloadText } from './helpers'

export function LogsCard({
  run,
  lines,
  level,
  setLevel,
  autoscroll,
  setAutoscroll,
  logRef,
}: {
  run: TrainingRun
  lines: string[]
  level: string
  setLevel: (value: string) => void
  autoscroll: boolean
  setAutoscroll: (value: boolean) => void
  logRef: React.RefObject<HTMLPreElement | null>
}) {
  const content = lines.join('\n') || 'No logs at this level.'
  return (
    <Card size="flush">
      <CardHeader className="flex-row flex-wrap items-center border-b [--card-section:--spacing(3)]">
        <CardTitle className="mr-auto">Logs</CardTitle>
        <Label className="flex items-center gap-2 text-xs leading-normal font-normal text-muted-foreground">
          <Checkbox
            checked={autoscroll}
            onCheckedChange={(value) => setAutoscroll(value === true)}
          />
          Autoscroll
        </Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger aria-label="Log level" className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadText(`${run.name}.log`, content)}
        >
          <Download />
          Download
        </Button>
      </CardHeader>
      <pre
        ref={logRef}
        className="max-h-72 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300"
      >
        {content}
      </pre>
    </Card>
  )
}
