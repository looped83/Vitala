import { Badge } from '@/ui/Badge/Badge';
import { RESOURCE_META } from '@/domain/rewards/display';
import {
  areaListLabel,
  buildingCategoryLabel,
  REGION_STATUS_LABEL,
  slotSizeLabel,
  SLOT_STATUS_LABEL,
  THEME_BUILDING_EXAMPLES,
} from '@/domain/city/display';
import { getRegionDefinition } from '@/domain/city/layout';
import type { CityModel } from '@/domain/city/model';
import type { RegionView, SlotView } from '@/domain/city/types';
import type { CitySelection } from './selection';
import styles from './city.module.css';

/** Badge tone by status so the label + colour agree (never colour alone). */
function statusTone(status: RegionView['status'] | SlotView['status']): 'neutral' | 'primary' {
  return status === 'locked' ? 'neutral' : 'primary';
}

export interface CityDetailProps {
  model: CityModel;
  selection: CitySelection;
}

/**
 * Unified detail content for a region or a building slot (§59). No buildings are
 * simulated (§60): a slot only ever explains its later use and that building
 * begins in Phase 7. Renders nothing structural when there is no selection so
 * the caller can decide the empty state.
 */
export function CityDetail({ model, selection }: CityDetailProps): React.JSX.Element {
  if (!selection) {
    return (
      <p className={styles.detailEmpty}>
        Wähle einen Stadtbereich oder eine Baufläche, um Details zu sehen.
      </p>
    );
  }

  if (selection.kind === 'region') {
    const region = model.regions.find((r) => r.definition.id === selection.regionId);
    if (!region) return <p className={styles.detailEmpty}>Dieser Bereich ist nicht bekannt.</p>;
    return <RegionDetail region={region} currentLevel={model.state.currentLevel} />;
  }

  const slotRegion = model.regions.find((r) =>
    r.slots.some((s) => s.definition.id === selection.slotId),
  );
  const slot = slotRegion?.slots.find((s) => s.definition.id === selection.slotId);
  if (!slotRegion || !slot) {
    return <p className={styles.detailEmpty}>Diese Baufläche ist nicht bekannt.</p>;
  }
  return <SlotDetail slot={slot} region={slotRegion} />;
}

function RegionDetail({
  region,
  currentLevel,
}: {
  region: RegionView;
  currentLevel: number;
}): React.JSX.Element {
  const { definition, status } = region;
  const resource = RESOURCE_META[definition.primaryResource];
  const locked = status === 'locked';
  const examples = THEME_BUILDING_EXAMPLES[definition.theme];

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <h3 className={styles.detailTitle}>{definition.title}</h3>
        <div className={styles.detailMeta}>
          <Badge tone={statusTone(status)}>{REGION_STATUS_LABEL[status]}</Badge>
          {status === 'newly_unlocked' ? <Badge tone="success">neu</Badge> : null}
        </div>
      </div>

      <p className={styles.listDesc}>{definition.description}</p>

      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>Status</dt>
          <dd>
            {locked
              ? `Wird auf Stadtlevel ${definition.unlockLevel} freigeschaltet.`
              : 'Freigeschaltet.'}
          </dd>
        </div>
        {locked ? (
          <div className={styles.detailRow}>
            <dt>Aktuelles Level</dt>
            <dd>Stadtlevel {currentLevel}</dd>
          </div>
        ) : null}
        <div className={styles.detailRow}>
          <dt>Ressource</dt>
          <dd>
            <span aria-hidden>{resource.symbol} </span>
            {resource.label}
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Lebensbereiche</dt>
          <dd>{areaListLabel(definition.areas)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Freie Bauflächen</dt>
          <dd>{region.availableSlots}</dd>
        </div>
      </dl>

      <p className={styles.listDesc}>{definition.outlook}</p>

      {examples.length > 0 ? (
        <p className={styles.previewNote}>
          Spätere Bauoptionen (Vorschau, Bau folgt in einer späteren Phase): {examples.join(', ')}.
        </p>
      ) : null}
    </div>
  );
}

function SlotDetail({ slot, region }: { slot: SlotView; region: RegionView }): React.JSX.Element {
  const { definition, status } = slot;
  const regionDef = getRegionDefinition(definition.regionId) ?? region.definition;
  const examples = THEME_BUILDING_EXAMPLES[regionDef.theme];

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <h3 className={styles.detailTitle}>{slotSizeLabel(definition.size)}</h3>
        <div className={styles.detailMeta}>
          <Badge tone={statusTone(status)}>{SLOT_STATUS_LABEL[status]}</Badge>
        </div>
      </div>

      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>Bereich</dt>
          <dd>{regionDef.title}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Größe</dt>
          <dd>{slotSizeLabel(definition.size)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Gebäudekategorien</dt>
          <dd>{definition.allowedCategories.map(buildingCategoryLabel).join(', ')}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Freischaltung</dt>
          <dd>ab Stadtlevel {definition.unlockLevel}</dd>
        </div>
      </dl>

      <p className={styles.previewNote}>
        {status === 'reserved'
          ? 'Diese Fläche ist für eine spätere Ausbauphase reserviert.'
          : 'Diese Baufläche ist bereit. Das eigentliche Bauen von Gebäuden folgt in Phase 7 – hier werden dann Ressourcen eingesetzt.'}
        {examples.length > 0 ? ` Mögliche Gebäude hier: ${examples.join(', ')}.` : ''}
      </p>
    </div>
  );
}
