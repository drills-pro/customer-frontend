import { Bot } from 'lucide-react'

export function DashboardEmptyMessage({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center p-6 text-center">
      <Bot className="mb-2 size-7 text-slate-300" />
      <strong>{title}</strong>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
