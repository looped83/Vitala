import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { RESOURCE_META } from '@/domain/rewards/display';
import {
  areaListLabel,
  REGION_STATUS_LABEL,
  slotSizeLabel,
  SLOT_STATUS_LABEL,
} from '@/domain/city/display';
import { slotA11yLabel } from '@/domain/city/a11y';
import type { CityModel } from '@/domain/city/model';
import type { RegionView } from '@/domain/city/types';
import type { RegionId } from '@/domain/city/types';
import styles from './city.module.css';

export interface CityListProps {
  model: CityModel;
  onSelectRegion: (regionId: RegionId) => void;
  onSelectSlot: (slotId: string) => void;
}

/**
 * The equivalent, fully-featured list view (§29). This is not a fallback — it
 * exposes every region, its unlock status + level, primary resource, free slot
 * count, slot types and description, with the same selection actions as the map.
 */
export function CityList({
  model,
  onSelectRegion,
  onSelectSlot,
}: CityListProps): React.JSX.Element {
  return (
    <ul className={styles.list} aria-label="Stadtbereiche als Liste">
      {model.regions.map((region) => (
        <CityListItem
          key={region.definition.id}
          region={region}
          currentLevel={model.state.currentLevel}
          onSelectRegion={onSelectRegion}
          onSelectSlot={onSelectSlot}
        />
      ))}
    </ul>
  );
}

function CityListItem({
  region,
  currentLevel,
  onSelectRegion,
  onSelectSlot,
}: {
  region: RegionView;
  currentLevel: number;
  onSelectRegion: (regionId: RegionId) => void;
  onSelectSlot: (slotId: string) => void;
}): React.JSX.Element {
  const { definition, status } = region;
  const locked = status === 'locked';
  const resource = RESOURCE_META[definition.primaryResource];
  const openSlots = region.slots.filter((s) => s.status !== 'locked');

  return (
    <li className={`${styles.listItem} ${locked ? styles.listItemLocked : ''}`}>
      <div className={styles.listHead}>
        <h3 className={styles.listTitle}>{definition.title}</h3>
        <div className={styles.detailMeta}>
          <Badge tone={locked ? 'neutral' : 'primary'}>{REGION_STATUS_LABEL[status]}</Badge>
          {status === 'newly_unlocked' ? <Badge tone="success">neu</Badge> : null}
        </div>
      </div>

      <p className={styles.listDesc}>{definition.description}</p>

      <div className={styles.listFacts}>
        <span>
          {locked ? `Freischaltung: Stadtlevel ${definition.unlockLevel}` : 'Freigeschaltet'}
        </span>
        <span>
          <span aria-hidden>{resource.symbol} </span>
          Ressource: {resource.label}
        </span>
        <span>Bereiche: {areaListLabel(definition.areas)}</span>
        <span>Freie Bauflächen: {region.availableSlots}</span>
      </div>

      {locked ? (
        <p className={styles.listDesc}>
          Dieser Bereich wird auf Stadtlevel {definition.unlockLevel} freigeschaltet. Aktuell seid
          ihr auf Stadtlevel {currentLevel}.
        </p>
      ) : null}

      <div className={styles.listActions}>
        <Button variant="secondary" onClick={() => onSelectRegion(definition.id)}>
          Details
        </Button>
      </div>

      {openSlots.length > 0 ? (
        <ul className={styles.slotList} aria-label={`Bauflächen im ${definition.title}`}>
          {openSlots.map((slot) => (
            <li key={slot.definition.id}>
              <button
                type="button"
                className={styles.slotListItem}
                onClick={() => onSelectSlot(slot.definition.id)}
                aria-label={`Details: ${slotA11yLabel(slot, definition.title)}`}
              >
                <span>{slotSizeLabel(slot.definition.size)}</span>
                <Badge tone={slot.status === 'reserved' ? 'neutral' : 'info'}>
                  {SLOT_STATUS_LABEL[slot.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
