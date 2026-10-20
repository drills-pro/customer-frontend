import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Grid,
  Heading,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

import { useDashboardLayout } from '@/features/dashboard/context'
import {
  BasicsStep,
  StartMethodStep,
  steps,
  TaskStep,
  useNewProjectDraft,
} from './-components/new-project'

export const Route = createFileRoute('/_app/projects_/new')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const { hydrated } = useDashboardLayout()

  if (!hydrated) {
    return <Box as="main" id="dashboard-main" minH="96" flex="1" />
  }

  return <NewProjectFlow />
}

function NewProjectFlow() {
  const { org } = useDashboardLayout()
  const draft = useNewProjectDraft()
  const { step, setStep } = draft

  return (
    <Box
      as="main"
      id="dashboard-main"
      mx="auto"
      w="full"
      maxW="1448px"
      minW="0"
      flex="1"
      p={{ base: '4', sm: '6' }}
    >
      <Box mb="6">
        <Heading
          as="h1"
          fontSize="2xl"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          Create project
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Set up a new project in {org.name}.
        </Text>
      </Box>

      <Grid
        minW="0"
        alignItems="start"
        gap="6"
        templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}
      >
        <Card.Root variant="outline" minW="0" gridColumn={{ lg: 'span 2' }}>
          <Card.Body p="6">
            <Flex mb="6" align="center" gap="2">
              {steps.map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 && (
                    <Box
                      h="1px"
                      flex="1"
                      bg={index <= step ? 'brand' : 'border'}
                    />
                  )}
                  <Button
                    type="button"
                    variant="plain"
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step}
                    aria-current={step === index ? 'step' : undefined}
                    h="auto"
                    gap="2"
                    px="0"
                    textStyle="body-sm"
                    fontWeight="medium"
                    _disabled={{ cursor: 'not-allowed', opacity: 1 }}
                  >
                    <Center
                      boxSize="6"
                      flexShrink={0}
                      rounded="full"
                      fontSize="11px"
                      fontWeight="semibold"
                      colorPalette={
                        index < step
                          ? 'success'
                          : index === step
                            ? 'brand'
                            : 'gray'
                      }
                      bg={index > step ? 'bg.muted' : 'colorPalette.solid'}
                      color={
                        index > step ? 'fg.muted' : 'colorPalette.contrast'
                      }
                    >
                      {index < step ? (
                        <Icon boxSize="3.5" asChild>
                          <Check />
                        </Icon>
                      ) : (
                        index + 1
                      )}
                    </Center>
                    <Text as="span" color={index === step ? 'fg' : 'fg.muted'}>
                      {label}
                    </Text>
                  </Button>
                </React.Fragment>
              ))}
            </Flex>

            {step === 0 && <BasicsStep draft={draft} />}
            {step === 1 && <TaskStep draft={draft} />}
            {step === 2 && <StartMethodStep draft={draft} />}

            <Flex
              mt="8"
              justify="space-between"
              borderTopWidth="1px"
              borderColor="border"
              pt="5"
            >
              {step === 0 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/projects">Cancel</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ChevronLeft />
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  variant="solid"
                  size="sm"
                  disabled={!draft.canContinue}
                  onClick={() => setStep((current) => current + 1)}
                >
                  Continue
                  <ChevronRight />
                </Button>
              ) : (
                <Button
                  variant="solid"
                  size="sm"
                  disabled={!draft.canSubmit || draft.submitting}
                  onClick={draft.create}
                >
                  {draft.submitting ? 'Creating…' : 'Create project'}
                  <ChevronRight />
                </Button>
              )}
            </Flex>
          </Card.Body>
        </Card.Root>

        <Box as="aside">
          <Card.Root variant="outline">
            <Card.Body p="5">
              <Stack gap="0">
                <Heading
                  as="h3"
                  mb="2"
                  textStyle="body-sm"
                  fontWeight="semibold"
                >
                  Summary
                </Heading>
                {draft.summaryRows.map(([label, value]) => (
                  <Flex
                    key={label}
                    justify="space-between"
                    gap="3"
                    py="2"
                    textStyle="body-sm"
                    borderBottomWidth="1px"
                    borderColor="border"
                    _last={{ borderBottomWidth: '0' }}
                  >
                    <Text as="span" color="fg.muted">
                      {label}
                    </Text>
                    <Text
                      as="span"
                      maxW="60%"
                      textAlign="end"
                      fontWeight="medium"
                    >
                      {value}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Grid>
    </Box>
  )
}
