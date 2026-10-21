import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { Actions } from './pages/Actions';
import { Brand } from './pages/Brand';
import { Data } from './pages/Data';
import { Feedback } from './pages/Feedback';
import { Forms } from './pages/Forms';
import { Motion } from './pages/Motion';
import { Navigation } from './pages/Navigation';
import { Overlays } from './pages/Overlays';
import { Overview } from './pages/Overview';
import { Selection } from './pages/Selection';

// Recharts is heavy: the Charts page loads on first visit only.
const Charts = lazy(() => import('./pages/Charts').then((m) => ({ default: m.Charts })));

/** The component gallery, one page per group; the dashboard shell lists them in its sidebar. */
export const PAGES: { id: string; label: string; Page: ComponentType | LazyExoticComponent<ComponentType> }[] = [
  { id: 'overview', label: 'Overview', Page: Overview },
  { id: 'actions', label: 'Actions', Page: Actions },
  { id: 'forms', label: 'Forms', Page: Forms },
  { id: 'selection', label: 'Selection', Page: Selection },
  { id: 'navigation', label: 'Navigation', Page: Navigation },
  { id: 'feedback', label: 'Feedback', Page: Feedback },
  { id: 'overlays', label: 'Overlays', Page: Overlays },
  { id: 'data', label: 'Data display', Page: Data },
  { id: 'charts', label: 'Charts', Page: Charts },
  { id: 'motion', label: 'Motion', Page: Motion },
  { id: 'brand', label: 'Brand', Page: Brand },
];
