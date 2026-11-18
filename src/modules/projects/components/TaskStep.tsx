import { Box, Button, Center, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TASK_TYPES, type TaskType } from '@/modules/projects/api';
import { TASK_ICONS } from '@/modules/projects/constants';

export function TaskStep({ task, setTask }: { task: TaskType | null; setTask: (task: TaskType) => void }) {
  const { t } = useTranslation();
  return (
    <Stack as="section" gap="5">
      <Box>
        <Heading as="h2" textStyle="h3">
          {t('newProject.task.title')}
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          {t('newProject.task.description')}
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
        {TASK_TYPES.map((id) => {
          const Icon = TASK_ICONS[id];
          return (
            <Button
              key={id}
              variant="option"
              onClick={() => setTask(id)}
              aria-pressed={task === id}
              alignItems="flex-start"
              justifyContent="flex-start"
              gap="3"
            >
              <Center data-task-icon boxSize="9" flexShrink={0} borderRadius="l2" bg="bg.subtle" color="fg.muted">
                <Icon width={18} height={18} />
              </Center>
              <Box minW="0">
                <Text textStyle="body-sm" fontWeight="semibold">
                  {t(`projects.taskType.${id}.label`)}
                </Text>
                <Text textStyle="body-sm" color="fg.muted">
                  {t(`projects.taskType.${id}.description`)}
                </Text>
              </Box>
            </Button>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
