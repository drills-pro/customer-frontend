/** Reference data: task types, regions, templates, architectures, compute. */
import type { ApiArchitecture, ApiComputeOption } from '@/features/catalog/api/types';
import { retiredRoute } from '../router';
import { architecturesFor, computeOptions, plans, projectTemplates, regions, taskTypes } from '../seed/catalog';
import { servingInstanceTypes } from '../seed/deployments';

retiredRoute('GET', '/v1/catalog/task-types', () => taskTypes);

retiredRoute('GET', '/v1/catalog/regions', () => regions);

retiredRoute('GET', '/v1/catalog/project-templates', ({ query }) => {
  const taskType = query.get('task_type');
  return taskType ? projectTemplates.filter((item) => item.task_type === taskType) : projectTemplates;
});

retiredRoute('GET', '/v1/catalog/architectures', ({ query }): ApiArchitecture[] =>
  architecturesFor(query.get('task_type') ?? '').map(({ factor: _, ...architecture }) => architecture),
);

retiredRoute('GET', '/v1/catalog/compute-options', ({ query }): ApiComputeOption[] =>
  query.get('purpose') === 'serving'
    ? servingInstanceTypes.map((id) => ({
        id,
        name: id,
        specification: '',
        hourly_rate_usd: 0,
      }))
    : computeOptions.map(({ performance: _, ...option }) => option),
);

retiredRoute('GET', '/v1/catalog/plans', () => plans);
