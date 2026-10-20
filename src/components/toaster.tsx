import { useTranslation } from 'react-i18next';
import { Portal, Spinner, Stack, Toast, Toaster as ChakraToaster, createToaster } from '@chakra-ui/react';

export const toaster = createToaster({ placement: 'bottom-end', pauseOnPageIdle: true, overlap: true, max: 3, gap: 12 });

export function Toaster() {
  const { t } = useTranslation();
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }}>
            {toast.type === 'loading' ? <Spinner size="sm" color="brand-text" /> : <Toast.Indicator />}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
            </Stack>
            {toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
            <Toast.CloseTrigger aria-label={t('toast.dismiss')} />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
}
