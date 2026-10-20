import { Box, Card, Flex } from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'

import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import { useDashboardLayout } from '@/features/dashboard/context'
import type { ThemePreference } from '@/features/dashboard/data'
import { themeLabel } from './-components/account-data'
import { PageHeader } from './-components/page-header'

// Swatches depict each theme, so they keep fixed colors in either theme.
const lightSwatch = 'var(--chakra-colors-white)'
const darkSwatch = 'var(--chakra-colors-gray-900)'
const themeOptions: Array<{ theme: ThemePreference; swatch: string }> = [
  { theme: 'light', swatch: lightSwatch },
  { theme: 'dark', swatch: darkSwatch },
  {
    theme: 'system',
    swatch: `linear-gradient(90deg, ${lightSwatch} 50%, ${darkSwatch} 50%)`,
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
    <Card.Root variant="outline">
      <RadioButtonGroup
        aria-label="Theme"
        value={preferences.theme}
        onChange={(value) =>
          updatePreferences({ theme: value as ThemePreference })
        }
        display="flex"
        flexWrap="wrap"
        gap="3"
        p="5"
      >
        {themeOptions.map(({ theme, swatch }) => (
          <RadioButton
            key={theme}
            value={theme}
            variant="option"
            w="28"
            p="2.5"
            flexDirection="column"
            alignItems="stretch"
            gap="2"
            rounded="l3"
          >
            <Box
              aria-hidden="true"
              h="12"
              rounded="l2"
              borderWidth="1px"
              borderColor="border"
              css={{ background: swatch }}
            />
            <Flex
              as="span"
              align="center"
              justify="space-between"
              gap="2"
              fontSize="xs"
              fontWeight="medium"
            >
              {themeLabel(theme)}
            </Flex>
          </RadioButton>
        ))}
      </RadioButtonGroup>
    </Card.Root>
  )
}
