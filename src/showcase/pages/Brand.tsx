import { Box, Grid, HStack, Stack, Text } from '@chakra-ui/react';
import { AppIcon, Bit, BitAnimated, Wordmark } from '@/brand/Bit';
import { Page, Section, q } from '@/showcase/parts';

const swatches = [
  ['surface', 'ink'],
  ['surface-raised', 'ink'],
  ['surface-sunken', 'ink'],
  ['brand', 'on-brand'],
  ['brand-soft', 'ink'],
  ['lens', 'on-lens'],
  ['night', 'on-night'],
  ['danger', 'on-danger'],
] as const;

const type = [
  ['display', 'Teach it with examples'],
  ['h1', 'Datasets'],
  ['h2', 'Defect detector v3'],
  ['h3', 'Training settings'],
  ['body', 'Upload photos, draw boxes, and press train.'],
  ['body-sm', 'We will email you when it finishes.'],
  ['label', 'Dataset name'],
  ['mono', 'POST /v1/models/defect-v3/predict'],
] as const;

export function Brand() {
  return (
    <Page title="Brand" lead="The workshop arcade: pixel mascot, warm paper, one loud orange.">
      <Section title="Logo and icon">
        <HStack gap="5" wrap="wrap">
          <AppIcon size={64} />
          <Wordmark scale={3} />
        </HStack>
      </Section>

      <Section title="Mascot">
        <HStack gap="4" wrap="wrap" bg="night" p="4" borderRadius="l3">
          <Bit pose="detect" size={128} />
          <Bit pose="ship" size={128} />
          <Bit pose="oops" size={128} />
          <BitAnimated timeline="train" size={128} paused={!!q.get('still')} />
          <Text color="on-night" textStyle="body-sm" maxW="40">
            Bit carries a paper rim, so it reads on any ground.
          </Text>
        </HStack>
      </Section>

      <Section title="Color roles" wide>
        <Grid templateColumns="repeat(auto-fill, minmax(9rem, 1fr))" gap="3">
          {swatches.map(([bg, fg]) => (
            <Box key={bg} bg={bg} color={fg} borderWidth="1px" borderColor="border" borderRadius="l2" p="3" h="20">
              <Text textStyle="mono-sm" fontFamily="mono">
                {bg}
              </Text>
            </Box>
          ))}
        </Grid>
      </Section>

      <Section title="Type" wide>
        <Stack gap="3">
          {type.map(([style, sample]) => (
            <HStack key={style} gap="4" align="baseline">
              <Text textStyle="mono-sm" fontFamily="mono" color="fg.muted" w="20" flexShrink="0">
                {style}
              </Text>
              <Text textStyle={style}>{sample}</Text>
            </HStack>
          ))}
        </Stack>
      </Section>
    </Page>
  );
}
