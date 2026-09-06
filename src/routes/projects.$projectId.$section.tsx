import { createFileRoute, useParams } from '@tanstack/react-router'
import { DatasetList } from '../features/drills/Datasets'
import { DeploymentList, ModelList } from '../features/drills/Models'
import { ProjectOverview, ProjectSettings } from '../features/drills/Projects'
import { TrainingList } from '../features/drills/Training'
import { Missing } from '../features/drills/components/display'
import { ProjectHead } from '../features/drills/components/project-navigation'
import { sections } from '../features/drills/navigation'
import { useProject } from '../features/drills/hooks'

export const Route = createFileRoute('/projects/$projectId/$section')({
  component: ProjectPage,
})

function ProjectPage() {
  const { section } = useParams({ strict: false })
  const project = useProject()
  if (!project || !sections.some((s) => s === section)) return <Missing />
  return (
    <>
      <ProjectHead project={project} section={section || 'overview'} />
      <div className="section-space" key={`${project.id}-${section}`}>
        {section === 'overview' ? (
          <ProjectOverview project={project} />
        ) : section === 'datasets' ? (
          <DatasetList project={project} />
        ) : section === 'training' ? (
          <TrainingList project={project} />
        ) : section === 'models' ? (
          <ModelList project={project} />
        ) : section === 'deployments' ? (
          <DeploymentList project={project} />
        ) : (
          <ProjectSettings project={project} />
        )}
      </div>
    </>
  )
}

