import { Card } from '@/ui/Card/Card';
import type { CityModel } from '@/domain/city/model';
import styles from './city.module.css';

export interface CityWorldStatusProps {
  model: CityModel;
  /** Title of the most recently unlocked region, if any. */
  lastUnlocked: string | null;
}

/**
 * Compact, factual world status (§36). Only real, derived values — no fictional
 * population, CO₂, air-quality or happiness scores.
 */
export function CityWorldStatus({ model, lastUnlocked }: CityWorldStatusProps): React.JSX.Element {
  const facts: { label: string; value: string }[] = [
    { label: 'Stadtlevel', value: String(model.state.currentLevel) },
    {
      label: 'Erschlossene Bereiche',
      value: `${model.unlockedRegions} von ${model.totalRegions}`,
    },
    { label: 'Freie Bauflächen', value: String(model.availableSlots) },
    {
      label: 'Zuletzt freigeschaltet',
      value: lastUnlocked ?? 'Stadtzentrum',
    },
  ];

  return (
    <Card>
      <dl className={styles.detailList}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.detailRow}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
