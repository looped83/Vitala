import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { Icon } from '@/ui/Icon/Icon';
import { ProgressBar } from '@/features/goals/ProgressBar';
import { levelForXp } from '@/domain/rewards/levels';
import type { CityModel } from '@/domain/city/model';
import type { ResolvedCityView } from '@/domain/city/view';
import styles from './city.module.css';

export interface CityHeaderProps {
  model: CityModel;
  view: ResolvedCityView;
  onChangeView: (view: ResolvedCityView) => void;
  onRename: () => void;
}

/**
 * City header (§23): name, city level + development stage, progress to the next
 * level and the next unlock, plus the map/list toggle. Deliberately sparse — no
 * personal XP, no mission details, no crowded metrics.
 */
export function CityHeader({
  model,
  view,
  onChangeView,
  onRename,
}: CityHeaderProps): React.JSX.Element {
  const { state, stage, nextUnlock } = model;
  const status = levelForXp('city', state.cityXp);
  const atMax = status.nextLevelXp <= status.levelFloorXp;

  return (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.cityTitleRow}>
          <Badge tone="primary">
            Stadtlevel {state.currentLevel} · {stage.title}
          </Badge>
          <Button variant="quiet" onClick={onRename} leadingIcon={<Icon name="edit" size={16} />}>
            Umbenennen
          </Button>
        </div>

        <p className={styles.stageLine}>{stage.description}</p>

        <ProgressBar
          value={status.xpIntoLevel}
          target={Math.max(1, status.xpForLevel)}
          label={`Stadtfortschritt zu Stadtlevel ${state.currentLevel + 1}`}
        />
        <p className={styles.stageLine}>
          {atMax
            ? `Höchste Stufe erreicht · ${status.totalXp} Stadt-XP gesamt`
            : `Noch ${status.xpToNext} Stadt-XP bis Stadtlevel ${state.currentLevel + 1}.`}
          {nextUnlock
            ? ` Als Nächstes: ${nextUnlock.title} ab Stadtlevel ${nextUnlock.unlockLevel}.`
            : ''}
        </p>
      </div>

      <div className={styles.headerControls}>
        <div className={styles.viewToggle} role="group" aria-label="Ansicht wählen">
          <Button
            variant={view === 'map' ? 'primary' : 'ghost'}
            aria-pressed={view === 'map'}
            onClick={() => onChangeView('map')}
            leadingIcon={<Icon name="city" size={16} />}
          >
            Karte
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'ghost'}
            aria-pressed={view === 'list'}
            onClick={() => onChangeView('list')}
            leadingIcon={<Icon name="menu" size={16} />}
          >
            Liste
          </Button>
        </div>
      </div>
    </header>
  );
}
