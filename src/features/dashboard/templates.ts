import type { Dataset, DashboardPreferences, Project } from './data'
import { allProjects } from './data'

export type ProjectTemplate = {
  id: string
  task: string
  name: string
  description: string
  datasetName: string
  modality: Dataset['modality']
  items: number
  size: string
  classes: number
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'retail-shelf-audit',
    task: 'Image Classification',
    name: 'Retail shelf audit',
    description: 'Classify product categories from shelf photos.',
    datasetName: 'retail-shelf-sample',
    modality: 'image',
    items: 1200,
    size: '180 MB',
    classes: 6,
  },
  {
    id: 'plant-disease',
    task: 'Image Classification',
    name: 'Plant disease detection',
    description: 'Identify crop disease from leaf close-ups.',
    datasetName: 'plant-disease-sample',
    modality: 'image',
    items: 940,
    size: '140 MB',
    classes: 8,
  },
  {
    id: 'surface-defects',
    task: 'Object Detection',
    name: 'Surface defect detection',
    description: 'Locate defects on production line imagery.',
    datasetName: 'surface-defect-sample',
    modality: 'image',
    items: 860,
    size: '210 MB',
    classes: 4,
  },
  {
    id: 'ppe-compliance',
    task: 'Object Detection',
    name: 'PPE compliance',
    description: 'Detect helmets, vests, and gloves in site photos.',
    datasetName: 'ppe-compliance-sample',
    modality: 'image',
    items: 780,
    size: '190 MB',
    classes: 5,
  },
  {
    id: 'road-scene-segmentation',
    task: 'Segmentation',
    name: 'Road scene segmentation',
    description: 'Pixel-level segmentation of road, lane, and obstacles.',
    datasetName: 'road-scene-sample',
    modality: 'image',
    items: 620,
    size: '340 MB',
    classes: 7,
  },
  {
    id: 'medical-scan-segmentation',
    task: 'Segmentation',
    name: 'Medical scan segmentation',
    description: 'Segment anatomical structures from scan slices.',
    datasetName: 'medical-scan-sample',
    modality: 'image',
    items: 410,
    size: '280 MB',
    classes: 3,
  },
  {
    id: 'support-ticket-routing',
    task: 'Text Classification',
    name: 'Support ticket routing',
    description: 'Route inbound tickets to the right queue.',
    datasetName: 'support-ticket-sample',
    modality: 'text',
    items: 3200,
    size: '6.1 MB',
    classes: 6,
  },
  {
    id: 'review-sentiment',
    task: 'Text Classification',
    name: 'Review sentiment',
    description: 'Classify customer reviews as positive, neutral, negative.',
    datasetName: 'review-sentiment-sample',
    modality: 'text',
    items: 4100,
    size: '7.8 MB',
    classes: 3,
  },
  {
    id: 'invoice-entities',
    task: 'Named Entity Recognition',
    name: 'Invoice entity extraction',
    description: 'Tag vendor, amount, and date entities in invoice text.',
    datasetName: 'invoice-entity-sample',
    modality: 'text',
    items: 1500,
    size: '3.2 MB',
    classes: 5,
  },
  {
    id: 'resume-entities',
    task: 'Named Entity Recognition',
    name: 'Resume entity extraction',
    description: 'Tag skills, employers, and titles in resume text.',
    datasetName: 'resume-entity-sample',
    modality: 'text',
    items: 1100,
    size: '2.6 MB',
    classes: 6,
  },
  {
    id: 'churn-prediction',
    task: 'Tabular Prediction',
    name: 'Subscriber churn',
    description: 'Predict 90-day subscriber churn from usage signals.',
    datasetName: 'churn-sample',
    modality: 'tabular',
    items: 8600,
    size: '4.4 MB',
    classes: 2,
  },
  {
    id: 'credit-risk',
    task: 'Tabular Prediction',
    name: 'Credit risk scoring',
    description: 'Score loan applications for default risk.',
    datasetName: 'credit-risk-sample',
    modality: 'tabular',
    items: 9400,
    size: '5.1 MB',
    classes: 2,
  },
  {
    id: 'demand-forecast',
    task: 'Time Series',
    name: 'Weekly demand forecast',
    description: 'Forecast SKU-level demand for the next 4 weeks.',
    datasetName: 'demand-sample',
    modality: 'tabular',
    items: 5200,
    size: '3.8 MB',
    classes: 0,
  },
  {
    id: 'energy-load-forecast',
    task: 'Time Series',
    name: 'Energy load forecast',
    description: 'Forecast hourly grid load from historical usage.',
    datasetName: 'energy-load-sample',
    modality: 'tabular',
    items: 6100,
    size: '4.6 MB',
    classes: 0,
  },
]

export function templatesForTask(task: string) {
  return projectTemplates.filter((template) => template.task === task)
}

export function createTemplateDataset(
  projectId: string,
  template: ProjectTemplate,
): Dataset {
  return {
    id: `${projectId}-${template.datasetName}`,
    projectId,
    name: template.datasetName,
    modality: template.modality,
    split: 'Train',
    items: template.items,
    size: template.size,
    classes: template.classes,
    version: 1,
    status: 'Ready',
    created: 'Just now',
    files: [],
  }
}

export function cloneCandidatesFor(
  orgId: string,
  task: string,
  preferences: DashboardPreferences,
): Project[] {
  return allProjects(preferences).filter(
    (project) => project.orgId === orgId && project.task === task,
  )
}
