import * as React from 'react'
import { cn } from 'cn'
import { Slider as SliderPrimitive } from 'radix-ui'

type SliderContextValue = {
  toPercent: (value: number) => number
  boundAt: (index: number) => number
}

const SliderContext = React.createContext<SliderContextValue>({
  toPercent: () => 0,
  boundAt: () => 0,
})

function Slider({
  className,
  children,
  value,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  orientation = 'horizontal',
  dir,
  inverted = false,
  onValueChange,
  onPointerDown,
  onPointerMove,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  value: number[]
  children: React.ReactNode
}) {
  const span = max - min || 1
  const activeIndexRef = React.useRef(0)

  const context: SliderContextValue = {
    toPercent: (current) => ((current - min) / span) * 100,
    boundAt: (index) =>
      index < 0 ? min : index >= value.length ? max : value[index],
  }

  // Radix re-sorts values on every move, so a fast drag can jump a thumb past
  // its neighbour. Horizontal drags are handled here instead, keeping each
  // thumb between its neighbours.
  const handlesDrag = orientation === 'horizontal' && value.length > 1

  const valueFromPointer = (event: React.PointerEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / (rect.width || 1)
    const fromLeft = (dir === 'rtl') === inverted
    return min + (fromLeft ? ratio : 1 - ratio) * span
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      orientation={orientation}
      dir={dir}
      inverted={inverted}
      onValueChange={onValueChange}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!handlesDrag) return
        const pointerValue = valueFromPointer(event)
        const distances = value.map((current) =>
          Math.abs(current - pointerValue),
        )
        activeIndexRef.current = distances.indexOf(Math.min(...distances))
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (
          !handlesDrag ||
          event.defaultPrevented ||
          !(event.target as HTMLElement).hasPointerCapture(event.pointerId)
        ) {
          return
        }
        event.preventDefault()

        const index = activeIndexRef.current
        const gap = minStepsBetweenThumbs * step
        const lower = index > 0 ? value[index - 1] + gap : min
        const upper = index < value.length - 1 ? value[index + 1] - gap : max
        const snapped =
          Math.round((valueFromPointer(event) - min) / step) * step + min
        const next = Math.min(Math.max(snapped, lower), upper)

        if (next !== value[index]) {
          const nextValues = [...value]
          nextValues[index] = next
          onValueChange?.(nextValues)
        }
      }}
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        className,
      )}
      {...props}
    >
      <SliderContext.Provider value={context}>
        {children}
      </SliderContext.Provider>
    </SliderPrimitive.Root>
  )
}

function SliderBar({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Track>) {
  return (
    <SliderPrimitive.Track
      data-slot="slider-track"
      className={cn(
        'relative h-1 w-full grow overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function SliderMark({
  className,
  index = 0,
  from,
  to,
  style,
  ...props
}: React.ComponentProps<'div'> & {
  index?: number
  from?: number
  to?: number
}) {
  const context = React.useContext(SliderContext)
  const start = context.toPercent(from ?? context.boundAt(index - 1))
  const end = context.toPercent(to ?? context.boundAt(index))

  return (
    <div
      data-slot="slider-mark"
      data-index={index}
      style={{
        left: `${start}%`,
        width: `${Math.max(0, end - start)}%`,
        ...style,
      }}
      className={cn(
        'absolute inset-y-0 flex items-center justify-center overflow-hidden bg-primary whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

function SliderDragger({
  className,
  label,
  valueText,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Thumb> & {
  label?: string
  valueText?: string
}) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      aria-label={label}
      aria-valuetext={valueText}
      className={cn(
        'relative block size-3 shrink-0 cursor-ew-resize rounded-full border border-ring bg-card ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 outline-hidden hover:ring-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring active:ring-3 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Slider, SliderBar, SliderMark, SliderDragger }
