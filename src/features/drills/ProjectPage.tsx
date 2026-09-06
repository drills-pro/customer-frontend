import { useParams } from '@tanstack/react-router'
import { DatasetList } from './Datasets'
import { DeploymentList, ModelList } from './Models'
import { ProjectOverview, ProjectSettings } from './Projects'
import { TrainingList } from './Training'
import { Missing } from './components/display'
import { ProjectHead } from './components/project-navigation'
import { sections } from './navigation'
import { useProject } from './hooks'

export function ProjectPage() {
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
