import { Button } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';

import { RecordNotFound } from '@/components/shared/record-not-found';

export function RunNotFound({ projectId }: { projectId: string }) {
  return (
    <RecordNotFound title="Training run not found" description="This run does not exist in the selected project.">
      <Button asChild variant="solid" size="sm">
        <Link to="/projects/$projectId/overview" params={{ projectId }}>
          Return to project
        </Link>
      </Button>
    </RecordNotFound>
  );
}
