import type { IconName } from '@/ui/Icon/Icon';
import type { LifeArea } from '@/domain/activity/areas';

/** UI-layer mapping from a life area to its icon (kept out of the pure domain). */
export const AREA_ICON: Record<LifeArea, IconName> = {
  movement: 'movement',
  nutrition: 'nutrition',
  sustainability: 'sustainability',
  animal_welfare: 'animalWelfare',
};
