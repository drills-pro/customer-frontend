import { createFileRoute } from '@tanstack/react-router'

import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useDashboardLayout } from '@/features/dashboard/context'
import type { ThemePreference } from '@/features/dashboard/data'
import { themeLabel } from './-components/account-data'
import { PageHeader } from './-components/page-header'

// Swatches depict each theme, so they keep literal colors in either theme.
const themeOptions: Array<{ theme: ThemePreference; swatch: string }> = [
  { theme: 'light', swatch: 'bg-white ring-1 ring-border' },
  { theme: 'dark', swatch: 'bg-slate-900 ring-1 ring-border' },
  {
    theme: 'system',
    swatch:
      'bg-[linear-gradient(90deg,#fff_50%,#0f172a_50%)] ring-1 ring-border',
  },
]

export const Route = createFileRoute('/_app/account/appearance')({
  component: AppearanceRoute,
})

function AppearanceRoute() {
  return (
    <>
      <PageHeader
        title="Appearance"
        description="Choose how DRILLS looks on this device."
      />
      <AppearanceCard />
    </>
  )
}

function AppearanceCard() {
  const { preferences, updatePreferences } = useDashboardLayout()

  return (
    <Card size="flush">
      <CardContent className="p-5">
        <RadioGroup
          aria-label="Theme"
          value={preferences.theme}
          onValueChange={(value) => {
            updatePreferences({ theme: value as ThemePreference })
          }}
          className="flex flex-wrap gap-3"
        >
          {themeOptions.map(({ theme, swatch }) => (
            <label
              key={theme}
              htmlFor={`theme-${theme}`}
              className="grid w-28 cursor-pointer gap-2 rounded-xl border-2 border-border p-2.5 transition-colors hover:border-input has-data-[state=checked]:border-primary"
            >
              <span
                aria-hidden="true"
                className={`h-12 rounded-md ${swatch}`}
              />
              <span className="flex items-center justify-between gap-2 text-xs font-medium">
                {themeLabel(theme)}
                <RadioGroupItem id={`theme-${theme}`} value={theme} />
              </span>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
