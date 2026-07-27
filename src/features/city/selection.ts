import type { RegionId } from '@/domain/city/types';

/** What the user currently has selected on the map or in the list. */
export type CitySelection =
  { kind: 'region'; regionId: RegionId } | { kind: 'slot'; slotId: string } | null;

export function isRegionSelected(selection: CitySelection, regionId: RegionId): boolean {
  return selection?.kind === 'region' && selection.regionId === regionId;
}

export function isSlotSelected(selection: CitySelection, slotId: string): boolean {
  return selection?.kind === 'slot' && selection.slotId === slotId;
}
