import { Dialog } from '@/ui/Dialog/Dialog';
import { LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import type {
  ActivityType,
  HistoryEntry,
  RitualDefinition,
  Favorite,
} from '@/domain/activity/types';
import type { HouseholdMemberWithProfile } from '@/data/repositories/household';
import { MovementForm } from './MovementForm';
import { RitualForm } from './RitualForm';

export interface CaptureDialogProps {
  open: boolean;
  area: LifeArea;
  types: ActivityType[];
  definitions: RitualDefinition[];
  partner: HouseholdMemberWithProfile | null;
  currentUserId: string;
  existingEntries: HistoryEntry[];
  /** Set when editing an existing entry. */
  initial?: HistoryEntry;
  /** Set when starting from a favourite. */
  favorite?: Favorite;
  onClose: () => void;
}

/**
 * Modal capture sheet. Chooses the movement or ritual form by area, prefilled
 * from a favourite or an existing entry. Focus is trapped and returned on close
 * (Dialog handles it — accessibility §31.4).
 */
export function CaptureDialog({
  open,
  area,
  types,
  definitions,
  partner,
  currentUserId,
  existingEntries,
  initial,
  favorite,
  onClose,
}: CaptureDialogProps): React.JSX.Element | null {
  if (!open) return null;
  const meta = LIFE_AREA_META[area];
  const title = initial ? `${meta.label} bearbeiten` : `${meta.label} erfassen`;

  return (
    <Dialog open={open} onClose={onClose} title={title} className="captureDialog">
      {area === 'movement' ? (
        <MovementForm
          types={types}
          partner={partner}
          currentUserId={currentUserId}
          existingEntries={existingEntries}
          initial={initial}
          prefill={
            favorite
              ? {
                  activityTypeId: favorite.activityTypeId ?? undefined,
                  durationMin: favorite.durationMin,
                  intensity: favorite.intensity,
                  isShared: favorite.isShared,
                }
              : undefined
          }
          onSaved={onClose}
        />
      ) : (
        <RitualForm
          area={area}
          definitions={definitions}
          partner={partner}
          currentUserId={currentUserId}
          existingEntries={existingEntries}
          initial={initial}
          prefill={
            favorite
              ? { definitionIds: favorite.ritualDefinitionIds, isShared: favorite.isShared }
              : undefined
          }
          onSaved={onClose}
        />
      )}
    </Dialog>
  );
}
