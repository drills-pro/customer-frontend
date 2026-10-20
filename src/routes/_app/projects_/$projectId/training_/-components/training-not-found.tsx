import { Button } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'

import { RecordNotFound } from '@/components/shared/record-not-found'

export function TrainingNotFound() {
  return (
    <RecordNotFound
      title="Project not found"
      description="This project is not available in your organization."
    >
      <Button asChild variant="solid" size="sm">
        <Link to="/projects">Return to projects</Link>
      </Button>
    </RecordNotFound>
  )
}
