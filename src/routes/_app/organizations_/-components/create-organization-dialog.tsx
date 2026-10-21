import * as React from 'react';
import { Box, Button, Field, Fieldset, Flex, Input, InputGroup, Stack, Text } from '@chakra-ui/react';

import { OrgMark } from '@/features/organizations/components/org-ui';
import { AppDialog } from '@/components/shared/app-dialog';
import { RadioButton, RadioButtonGroup } from '@/components/shared/radio-button-group';
import { ApiError } from '@/api/client';
import { usePlans } from '@/features/catalog/queries';
import { orgPlans } from '@/features/dashboard/domain/types';
import type { OrgPlan, Organization } from '@/features/dashboard/domain/types';
import { orgColors } from '@/features/organizations/constants';
import { initialOf, toApiPlan } from '@/features/organizations/mappers';
import { useCreateOrganization } from '@/features/organizations/queries';
import { slugify } from '@/features/organizations/utils';
import { ColorSwatches, cleanSlugInput, orgNameError, orgSlugError } from './org-form';

const planBlurbs: Record<OrgPlan, string> = {
  Free: 'For trying DRILLS on your own.',
  Team: 'Shared projects and GPU credits for a team.',
  Enterprise: 'SSO, audit logs and dedicated compute.',
};

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  organizations,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  onCreated: (org: Organization) => void;
}) {
  const plans = usePlans().data;
  const create = useCreateOrganization();
  // A slug taken by an organization the user is not in is only known to the API.
  const [takenSlug, setTakenSlug] = React.useState<string>();
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [plan, setPlan] = React.useState<OrgPlan>('Team');
  const [color, setColor] = React.useState(orgColors[2]);
  const [submitted, setSubmitted] = React.useState(false);

  const effectiveSlug = slugEdited ? slug : name.trim() ? slugify(name).slice(0, 40) : '';
  const nameMessage = submitted ? orgNameError(name) : undefined;
  const slugMessage =
    effectiveSlug === takenSlug
      ? 'That URL is already taken.'
      : submitted || slugEdited
        ? orgSlugError(effectiveSlug, organizations)
        : undefined;

  const limitsOf = (option: OrgPlan) => plans?.find((item) => item.id === toApiPlan(option));

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setName('');
      setSlug('');
      setSlugEdited(false);
      setPlan('Team');
      setColor(orgColors[2]);
      setSubmitted(false);
      setTakenSlug(undefined);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (create.isPending || orgNameError(name) || orgSlugError(effectiveSlug, organizations)) return;
    create.mutate(
      { name: name.trim(), slug: effectiveSlug, plan: toApiPlan(plan), color },
      {
        onSuccess: (created) => {
          close(false);
          onCreated(created);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setTakenSlug(effectiveSlug);
          }
        },
      },
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      onSubmit={submit}
      size="lg"
      title="Create organization"
      description="A shared space for projects, datasets, members and billing."
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" size="sm" disabled={create.isPending}>
            Create organization
          </Button>
        </>
      }
    >
      <Stack gap="5">
        <Flex align="center" gap="3" rounded="l2" bg="bg.muted" p="3">
          <OrgMark org={{ initial: initialOf(name), color }} boxSize="10" fontSize="md" />
          <Box minW="0">
            <Text truncate fontWeight="medium">
              {name.trim() || 'New organization'}
            </Text>
            <Text truncate fontSize="xs" color="fg.muted">
              drills.ai/{effectiveSlug || 'your-org'}
            </Text>
          </Box>
        </Flex>

        <Field.Root invalid={Boolean(nameMessage)}>
          <Field.Label>Organization name</Field.Label>
          <Input value={name} placeholder="e.g. Contoso Vision" autoFocus onChange={(event) => setName(event.target.value)} />
          <Field.ErrorText>{nameMessage}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={Boolean(slugMessage)}>
          <Field.Label>URL</Field.Label>
          <InputGroup startAddon="drills.ai/">
            <Input
              value={effectiveSlug}
              placeholder="your-org"
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(cleanSlugInput(event.target.value));
              }}
            />
          </InputGroup>
          <Field.ErrorText>{slugMessage}</Field.ErrorText>
        </Field.Root>

        <Stack gap="2">
          <Text textStyle="body-sm" fontWeight="medium">
            Color
          </Text>
          <ColorSwatches label="Organization color" value={color} onChange={setColor} />
        </Stack>

        <Fieldset.Root>
          <Fieldset.Legend textStyle="body-sm" fontWeight="medium" mb="3">
            Plan
          </Fieldset.Legend>
          <RadioButtonGroup
            aria-label="Plan"
            value={plan}
            onChange={(value) => setPlan(value as OrgPlan)}
            flexDirection="column"
            alignItems="stretch"
            gap="2"
          >
            {orgPlans.map((option) => (
              <RadioButton key={option} value={option} variant="option" justifyContent="flex-start" p="3">
                <Box>
                  <Text textStyle="body-sm" fontWeight="medium">
                    {option}{' '}
                    <Text as="span" fontWeight="normal" color="fg.muted">
                      · {limitsOf(option)?.price}
                    </Text>
                  </Text>
                  <Text textStyle="body-sm" color="fg.muted">
                    {planBlurbs[option]} Up to {limitsOf(option)?.seats} seats.
                  </Text>
                </Box>
              </RadioButton>
            ))}
          </RadioButtonGroup>
        </Fieldset.Root>
      </Stack>
    </AppDialog>
  );
}
