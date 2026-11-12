import { Card, Table, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PERCENT } from '@/modules/training/constants';
import type { ConfusionMatrix } from '@/modules/training/report';

/** Past this many classes the grid is too large to read, so it is left out. */
export const MAX_CONFUSION_LABELS = 20;
/** Cell tints, as opacity steps of the brand color: a cell takes the step nearest its share of the row. */
const TINT_STEP = 20;
/** From this tint up, the cell's text switches to the brand's contrast color. */
const DARK_TINT = 60;

const tint = (count: number, rowTotal: number) => (rowTotal === 0 ? 0 : Math.round((count / rowTotal) * (PERCENT / TINT_STEP)) * TINT_STEP);

/** Which classes the model confuses: one row per true class, one column per predicted class, tinted by share of the row. */
export function ConfusionMatrixCard({ matrix }: { matrix: ConfusionMatrix }) {
  const { t } = useTranslation();
  if (matrix.labels.length > MAX_CONFUSION_LABELS) return null;
  return (
    <Card.Root variant="outline" data-testid="training-confusion">
      <Card.Header>
        <Card.Title as="h3" textStyle="body" fontWeight="semibold">
          {t('training.run.confusion.title')}
        </Card.Title>
        <Card.Description>{t('training.run.confusion.description')}</Card.Description>
      </Card.Header>
      <Card.Body>
        <Table.ScrollArea borderWidth="2px" borderColor="border" borderRadius="l2">
          <Table.Root size="sm" showColumnBorder>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>
                  <Text textStyle="body-sm" color="fg.muted">
                    {t('training.run.confusion.axes')}
                  </Text>
                </Table.ColumnHeader>
                {matrix.labels.map((label) => (
                  <Table.ColumnHeader key={label} fontFamily="mono" textAlign="end">
                    {label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {matrix.matrix.map((row, i) => {
                const total = row.reduce((a, b) => a + b, 0);
                return (
                  <Table.Row key={matrix.labels[i]}>
                    <Table.ColumnHeader as="th" scope="row" fontFamily="mono">
                      {matrix.labels[i]}
                    </Table.ColumnHeader>
                    {row.map((count, j) => {
                      const step = tint(count, total);
                      return (
                        <Table.Cell
                          key={matrix.labels[j]}
                          textAlign="end"
                          fontVariantNumeric="tabular-nums"
                          fontWeight={i === j ? 'semibold' : undefined}
                          bg={step > 0 ? `brand.solid/${step}` : undefined}
                          color={step >= DARK_TINT ? 'brand.contrast' : undefined}
                          data-testid={`training-confusion-${i}-${j}`}
                        >
                          {count}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Card.Body>
    </Card.Root>
  );
}
