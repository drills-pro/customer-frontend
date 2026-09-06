import { Link } from '@tanstack/react-router'
import { Check, Database } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar as ShadAvatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge as ShadBadge } from '@/components/ui/badge'
import {
  Card as ShadCard,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty as ShadEmpty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress as ShadProgress } from '@/components/ui/progress'
import {
  Table as ShadTable,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Project } from '../data'
import { Button } from './forms'

export function Card({
  children,
  title,
  action,
  className,
}: {
  children: ReactNode
  title?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <ShadCard
      className={cn(
        'gap-0 py-0 shadow-xs bg-card text-card-foreground',
        className,
      )}
    >
      {title && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn('p-0', title && '[&>.pad]:p-5')}>
        {children}
      </CardContent>
    </ShadCard>
  )
}

export function PageHead({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-head flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {actions && (
        <div className="actions flex flex-wrap gap-2 items-center">
          {actions}
        </div>
      )}
    </header>
  )
}

const success = new Set(['Live', 'Ready', 'Completed', 'Production'])
const pending = new Set(['Running', 'Processing', 'Deploying', 'Staging'])
const failed = new Set(['Failed', 'Error', 'Stopped'])

export function Badge({ status }: { status: string }) {
  const variant = failed.has(status)
    ? 'destructive'
    : success.has(status)
      ? 'outline'
      : 'secondary'

  return (
    <ShadBadge
      variant={variant}
      className={cn(
        'badge gap-1.5 font-medium px-2 py-0.5 text-xs rounded-md',
        success.has(status) &&
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        pending.has(status) &&
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full bg-current',
          pending.has(status) && 'animate-pulse',
        )}
      />
      {status}
    </ShadBadge>
  )
}

export function Progress({
  value,
  blue = false,
}: {
  value: number
  blue?: boolean
}) {
  return (
    <ShadProgress
      value={value}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-muted',
        blue && '[&_[data-slot=progress-indicator]]:bg-indigo-600',
      )}
    />
  )
}

export function Avatar({
  name = 'Alex Rivera',
  small = false,
}: {
  name?: string
  small?: boolean
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
  return (
    <ShadAvatar
      size={small ? 'sm' : 'default'}
      title={name}
      className="ring-2 ring-background"
    >
      <AvatarFallback className="bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        {initials}
      </AvatarFallback>
    </ShadAvatar>
  )
}

export function ProjectIcon({ project }: { project: Project }) {
  return (
    <span
      className="project-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-xs font-bold text-sm"
      style={{ background: project.color }}
      aria-hidden="true"
    >
      ◆
    </span>
  )
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="facts divide-y divide-slate-100 border-y border-slate-200 my-3">
      {items.map(([label, value]) => (
        <div
          className="flex items-center justify-between gap-4 py-2.5"
          key={label}
        >
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="text-right text-sm font-semibold text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Empty({
  title = 'Nothing here yet',
  description = 'Create your first resource to get started.',
  children,
}: {
  title?: string
  description?: string
  children?: ReactNode
}) {
  return (
    <ShadEmpty className="empty min-h-52 border rounded-xl bg-card p-6 text-center">
      <EmptyHeader className="flex flex-col items-center gap-2">
        <EmptyMedia
          variant="icon"
          className="size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground"
        >
          <Database className="size-5" />
        </EmptyMedia>
        <EmptyTitle>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        </EmptyTitle>
        <EmptyDescription className="text-sm text-muted-foreground max-w-sm">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {children && (
        <EmptyContent className="mt-4 flex justify-center">
          {children}
        </EmptyContent>
      )}
    </ShadEmpty>
  )
}

export function Missing() {
  return (
    <Empty
      title="This resource could not be found"
      description="It may have been removed, or the link is no longer available."
    >
      <Button asChild>
        <Link to="/projects">Back to projects</Link>
      </Button>
    </Empty>
  )
}

export function Table({
  headers,
  children,
}: {
  headers: ReactNode[]
  children: ReactNode
}) {
  return (
    <div className="table-scroll overflow-x-auto rounded-lg border bg-card">
      <ShadTable>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={index}
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y">{children}</TableBody>
      </ShadTable>
    </div>
  )
}

export function Kpi({
  title,
  value,
  change,
}: {
  title: string
  value: ReactNode
  change: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="space-y-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="flex items-end justify-between">
          <strong className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </strong>
          <svg
            width="84"
            height="28"
            viewBox="0 0 98 32"
            aria-hidden="true"
            className="text-indigo-600 dark:text-indigo-400"
          >
            <path
              d="M0 28 L14 22 L28 25 L42 16 L56 19 L70 10 L84 13 L98 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            ▲ {change}
          </span>
          <span className="text-muted-foreground">vs last 30d · sample</span>
        </div>
      </div>
    </Card>
  )
}

export function Steps({
  items,
  step,
  onStep,
}: {
  items: string[]
  step: number
  onStep?: (index: number) => void
}) {
  return (
    <ol className="steps flex flex-col gap-1.5" aria-label="Progress">
      {items.map((item, index) => (
        <li
          key={item}
          className={index === step ? 'current' : index < step ? 'done' : ''}
        >
          <button
            type="button"
            disabled={index > step || !onStep}
            onClick={() => onStep?.(index)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              index === step &&
                'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
              index < step && 'text-foreground hover:bg-muted/50',
              index > step &&
                'text-muted-foreground opacity-60 cursor-not-allowed',
            )}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                index <= step
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-background text-muted-foreground border-input',
              )}
            >
              {index < step ? (
                <Check className="size-3.5 stroke-[3]" />
              ) : (
                index + 1
              )}
            </span>
            {item}
          </button>
        </li>
      ))}
    </ol>
  )
}
