import { Clipboard, HStack, IconButton, Text } from '@chakra-ui/react';
import { Check, Copy } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

/** A project ID in mono with a button that copies it. */
export function CopyId({ id }: { id: string }) {
  const { t } = useTranslation();
  return (
    <Clipboard.Root value={id}>
      <HStack gap="1" minW="0">
        <Text textStyle="mono-sm" color="fg.muted" truncate>
          {id}
        </Text>
        <Clipboard.Trigger asChild>
          <IconButton variant="hint" size="xs" aria-label={t('projects.copyId')}>
            <Clipboard.Indicator copied={<Check />}>
              <Copy />
            </Clipboard.Indicator>
          </IconButton>
        </Clipboard.Trigger>
      </HStack>
    </Clipboard.Root>
  );
}
