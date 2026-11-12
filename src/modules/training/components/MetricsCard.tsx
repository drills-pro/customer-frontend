import { Card, DataList } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const FRACTION_DIGITS = 4;

/** Numeric results by name, as the trainer reports them. Nothing to show renders nothing. */
export function MetricsCard({ title, metrics, testId }: { title: string; metrics: Record<string, number>; testId: string }) {
  const { i18n } = useTranslation();
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: FRACTION_DIGITS });
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;
  return (
    <Card.Root variant="outline" data-testid={testId}>
      <Card.Header>
        <Card.Title as="h3" textStyle="body" fontWeight="semibold">
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <DataList.Root orientation="horizontal">
          {entries.map(([name, value]) => (
            <DataList.Item key={name} data-testid={`${testId}-${name}`}>
              <DataList.ItemLabel fontFamily="mono">{name}</DataList.ItemLabel>
              <DataList.ItemValue>{number.format(value)}</DataList.ItemValue>
            </DataList.Item>
          ))}
        </DataList.Root>
      </Card.Body>
    </Card.Root>
  );
}
