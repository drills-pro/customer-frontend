import type { ReactNode } from 'react';
import { Box, Button, Card, Flex, Heading, Stack, Steps, Text } from '@chakra-ui/react';
import { Check } from 'pixelarticons/react';

/** The step header of a create flow: one numbered item per label, ticked once passed. With `onSelect`, a passed step can be
 * clicked to go back to it; steps not reached yet stay disabled. */
export function WizardSteps({
  labels,
  step,
  orientation = 'horizontal',
  onSelect,
}: {
  labels: string[];
  step: number;
  orientation?: 'horizontal' | 'vertical';
  onSelect?: (step: number) => void;
}) {
  const label = (text: string, index: number) => (
    <>
      <Steps.Indicator>
        <Steps.Status complete={<Check />} incomplete={<Steps.Number />} current={<Steps.Number />} />
      </Steps.Indicator>
      <Steps.Title hideBelow={orientation === 'horizontal' ? 'sm' : undefined} data-testid={`wizard-step-${index}`}>
        {text}
      </Steps.Title>
    </>
  );
  return (
    <Steps.Root
      count={labels.length}
      step={step}
      linear={!onSelect}
      orientation={orientation}
      size="sm"
      onStepChange={(e) => onSelect?.(e.step)}
    >
      <Steps.List>
        {labels.map((text, index) => (
          <Steps.Item key={text} index={index}>
            {onSelect ? (
              <Steps.Trigger disabled={index > step} data-testid={`wizard-step-trigger-${index}`}>
                {label(text, index)}
              </Steps.Trigger>
            ) : (
              label(text, index)
            )}
            <Steps.Separator />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  );
}

/** The current step's body. Keyed by the step, so each step enters from the side it comes from. */
export function WizardBody({ step, children }: { step: number; children: ReactNode }) {
  return (
    <Card.Body
      key={step}
      animationName="step-in"
      animationDuration="bounce-gentle"
      animationTimingFunction="bounce-gentle-in-out"
      _motionReduce={{ animationName: 'fade-in' }}
    >
      {children}
    </Card.Body>
  );
}

/** A step's heading and one line on what it asks for. */
export function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <Box>
      <Heading as="h2" textStyle="h3">
        {title}
      </Heading>
      <Text mt="1" textStyle="body-sm" color="fg.muted">
        {description}
      </Text>
    </Box>
  );
}

export interface SummaryRow {
  id: string;
  label: string;
  value: string;
}

/** The aside beside a create flow: what has been chosen so far. */
export function SummaryCard({ title, rows, testId }: { title: string; rows: SummaryRow[]; testId?: string }) {
  return (
    <Card.Root as="aside" size="sm" minW="0" data-testid={testId}>
      <Card.Header>
        <Heading as="h2" textStyle="body" fontWeight="semibold">
          {title}
        </Heading>
      </Card.Header>
      <Card.Body gap="0">
        {rows.map((row) => (
          <Flex
            key={row.id}
            justify="space-between"
            gap="3"
            py="2"
            textStyle="body-sm"
            borderBottomWidth="1px"
            borderColor="border"
            _last={{ borderBottomWidth: '0' }}
            data-testid={`summary-${row.id}`}
          >
            <Text as="span" color="fg.muted">
              {row.label}
            </Text>
            <Text as="span" maxW="60%" textAlign="end" fontWeight="medium" wordBreak="break-word">
              {row.value}
            </Text>
          </Flex>
        ))}
      </Card.Body>
    </Card.Root>
  );
}

/** One reviewed value and the index of the step that changes it. */
export interface ReviewRow extends SummaryRow {
  edit: number;
}

/** The chosen values, each with a way back to the step that sets it. */
export function ReviewRows({
  rows,
  onEdit,
  editText,
  editLabel,
}: {
  rows: ReviewRow[];
  onEdit: (step: number) => void;
  editText: string;
  /** The Edit button's accessible name for one row. */
  editLabel: (label: string) => string;
}) {
  return (
    <Stack gap="2.5">
      {rows.map((row) => (
        <Flex key={row.id} align="center" justify="space-between" gap="4" borderRadius="l3" borderWidth="2px" borderColor="border" p="4">
          <Box minW="0">
            <Text textStyle="label" color="fg.muted" textTransform="uppercase">
              {row.label}
            </Text>
            <Text mt="1" textStyle="body-sm" fontWeight="semibold" wordBreak="break-word">
              {row.value}
            </Text>
          </Box>
          <Button
            variant="plain"
            size="xs"
            flexShrink={0}
            color="brand-text"
            onClick={() => onEdit(row.edit)}
            aria-label={editLabel(row.label)}
            data-testid={`review-edit-${row.id}`}
          >
            {editText}
          </Button>
        </Flex>
      ))}
    </Stack>
  );
}
