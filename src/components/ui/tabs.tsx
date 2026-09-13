import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Tabs as TabsPrimitive } from 'radix-ui'

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex items-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default:
          'w-fit justify-center rounded-lg p-[3px] bg-muted group-data-[orientation=horizontal]/tabs:h-8',
        line: '-mb-px flex w-full justify-start gap-6 border-b border-slate-200 bg-transparent p-0 overflow-x-auto rounded-none',
        chip: 'flex-wrap gap-2 rounded-none border-0 bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Default pill variant styling
        'group-data-[variant=default]/tabs-list:h-[calc(100%-1px)] group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-transparent group-data-[variant=default]/tabs-list:px-1.5 group-data-[variant=default]/tabs-list:py-0.5 group-data-[variant=default]/tabs-list:text-foreground/60 group-data-[variant=default]/tabs-list:hover:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm',
        // Line variant styling matching design
        'group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-1 group-data-[variant=line]/tabs-list:py-3 group-data-[variant=line]/tabs-list:text-slate-500 group-data-[variant=line]/tabs-list:hover:text-slate-800 group-data-[variant=line]/tabs-list:data-[state=active]:border-indigo-600 group-data-[variant=line]/tabs-list:data-[state=active]:text-indigo-600 group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none',
        // Chip variant styling matching design
        'group-data-[variant=chip]/tabs-list:flex-none group-data-[variant=chip]/tabs-list:rounded-full group-data-[variant=chip]/tabs-list:border group-data-[variant=chip]/tabs-list:border-slate-200 group-data-[variant=chip]/tabs-list:bg-white group-data-[variant=chip]/tabs-list:px-4 group-data-[variant=chip]/tabs-list:py-1.5 group-data-[variant=chip]/tabs-list:text-[13px] group-data-[variant=chip]/tabs-list:font-medium group-data-[variant=chip]/tabs-list:text-slate-600 group-data-[variant=chip]/tabs-list:hover:border-indigo-300 group-data-[variant=chip]/tabs-list:hover:text-indigo-600 group-data-[variant=chip]/tabs-list:data-[state=active]:border-indigo-600 group-data-[variant=chip]/tabs-list:data-[state=active]:bg-indigo-600 group-data-[variant=chip]/tabs-list:data-[state=active]:font-semibold group-data-[variant=chip]/tabs-list:data-[state=active]:text-white group-data-[variant=chip]/tabs-list:data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-hidden', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
