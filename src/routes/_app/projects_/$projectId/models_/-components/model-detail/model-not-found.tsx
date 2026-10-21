import { Button } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';

import { RecordNotFound } from '@/components/shared/record-not-found';

export function ModelNotFound({ projectId }: { projectId: string }) {
  return (
    <RecordNotFound title="Model not found" description="This model does not exist in the selected project.">
      <Button asChild variant="solid" size="sm">
        <Link to="/projects/$projectId/models" params={{ projectId }}>
          Return to models
        </Link>
      </Button>
    </RecordNotFound>
  );
}
