import { Box, Field, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SimpleSelect } from '@/components/simple-select';
import { VISIBILITIES, type Visibility } from '@/modules/projects/api';
import { NAME_MAX } from '@/modules/projects/constants';

interface Props {
  workspaces: { label: string; value: string }[];
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  name: string;
  setName: (name: string) => void;
  visibility: Visibility;
  setVisibility: (visibility: Visibility) => void;
}

export function BasicsStep(props: Props) {
  const { t } = useTranslation();
  const workspaceName = props.workspaces.find((w) => w.value === props.workspaceId)?.label ?? '';
  const visibilities = VISIBILITIES.map((v) => ({ label: t(`newProject.visibility.${v}`), value: v }));

  return (
    <Stack as="section" gap="5">
      <Box>
        <Heading as="h2" textStyle="h3">
          {t('newProject.basics.title')}
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          {t('newProject.basics.description')}
        </Text>
      </Box>
      {props.workspaces.length > 1 ? (
        <SimpleSelect
          label={t('newProject.basics.workspace')}
          width="full"
          items={props.workspaces}
          value={props.workspaceId}
          onChange={props.setWorkspaceId}
        />
      ) : (
        <Stack gap="1">
          <Text textStyle="label" color="fg.muted" textTransform="uppercase">
            {t('newProject.basics.workspace')}
          </Text>
          <Text>{workspaceName}</Text>
        </Stack>
      )}
      <Field.Root required invalid={props.name.length > 0 && !props.name.trim()}>
        <Field.Label>
          {t('newProject.basics.name')}
          <Field.RequiredIndicator />
        </Field.Label>
        <Input
          value={props.name}
          maxLength={NAME_MAX}
          placeholder={t('newProject.basics.namePlaceholder')}
          onChange={(e) => props.setName(e.target.value)}
        />
        <Field.HelperText>{t('newProject.basics.nameHelp')}</Field.HelperText>
      </Field.Root>
      <Stack gap="1.5">
        <SimpleSelect
          label={t('newProject.basics.visibilityLabel')}
          width="full"
          items={visibilities}
          value={props.visibility}
          onChange={(v) => props.setVisibility(v as Visibility)}
        />
        <Text textStyle="body-sm" color="fg.muted">
          {t(`newProject.visibilityHelp.${props.visibility}`, { workspace: workspaceName })}
        </Text>
      </Stack>
    </Stack>
  );
}
