import { cloneElement, isValidElement, useId } from 'react'
import { Search } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { Button as ShadButton } from '@/components/ui/button'
import {
  Field as ShadField,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs as ShadTabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type ButtonProps = Omit<React.ComponentProps<typeof ShadButton>, 'variant'> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
}

export function Button({
  variant = 'primary',
  type,
  asChild,
  ...props
}: ButtonProps) {
  const shadVariant =
    variant === 'primary'
      ? 'default'
      : variant === 'danger'
        ? 'destructive'
        : variant === 'subtle'
          ? 'secondary'
          : 'ghost'
  return (
    <ShadButton
      variant={shadVariant}
      type={asChild ? undefined : (type ?? 'button')}
      asChild={asChild}
      {...props}
    />
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  const fieldId = useId()
  const hintId = `${fieldId}-hint`
  const control = isValidElement(children)
    ? cloneElement(
      children as ReactElement<{
        id?: string
        className?: string
        autoFocus?: boolean
        'data-autofocus'?: boolean
        'aria-describedby'?: string
      }>,
      {
        id: fieldId,
        className: cn(
          'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          (children.props as { className?: string }).className,
        ),
        'data-autofocus':
          (children.props as { autoFocus?: boolean }).autoFocus || undefined,
        'aria-describedby': hint ? hintId : undefined,
      },
    )
    : children
  return (
    <ShadField className="field">
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      {control}
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
    </ShadField>
  )
}

export function Toolbar({
  query,
  setQuery,
  children,
}: {
  query: string
  setQuery: (value: string) => void
  children?: ReactNode
}) {
  return (
    <div className="toolbar flex flex-col gap-3 rounded-xl border border-slate-200 bg-card p-3 sm:flex-row sm:items-center">
      <label className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          aria-label="Search this list"
          placeholder="Search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <Select
      value={value || '__all'}
      onValueChange={(next) => onChange(next === '__all' ? '' : next)}
    >
      <SelectTrigger aria-label={label} className="min-w-36">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{label}</SelectItem>
        {options.map((option) => (
          <SelectItem value={option} key={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (value: string) => void
}) {
  return (
    <ShadTabs value={active} onValueChange={onChange} className="tabs mt-6">
      <TabsList
        variant="line"
        className="w-full justify-start overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab) => (
          <TabsTrigger value={tab} key={tab} className="flex-none px-3">
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadTabs>
  )
}
