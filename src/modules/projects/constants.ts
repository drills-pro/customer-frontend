import type { ComponentType, SVGProps } from 'react';
import { AiScan, Grid2x3, Image, TextStartT } from 'pixelarticons/react';
import type { TASK_TYPES } from '@/modules/projects/api';

type PixelIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** The wizard's steps; `done` shows the new project. Each id is also its `newProject.step.*` key. */
export const STEPS = ['basics', 'task', 'review', 'done'] as const;
export type StepId = (typeof STEPS)[number];
export const step = (id: StepId) => STEPS.indexOf(id);

/** A UI cap on the project name; the server stores any length. */
export const NAME_MAX = 100;

export const TASK_ICONS: Record<(typeof TASK_TYPES)[number], PixelIcon> = {
  'image-classification': Image,
  'object-detection': AiScan,
  'tabular-classification': Grid2x3,
  'text-classification': TextStartT,
};
