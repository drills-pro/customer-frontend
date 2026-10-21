import { Button } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';

import { RecordNotFound } from '@/components/shared/record-not-found';

export function DeploymentNotFound({ projectId }: { projectId: string }) {
  return (
    <RecordNotFound title="Deployment not found" description="This deployment does not exist in the selected project.">
      <Button asChild variant="solid" size="sm">
        <Link to="/projects/$projectId/deployments" params={{ projectId }}>
          Return to deployments
        </Link>
      </Button>
    </RecordNotFound>
  );
}
