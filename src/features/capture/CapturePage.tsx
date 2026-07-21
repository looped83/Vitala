import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Spinner } from '@/ui/Spinner/Spinner';
import { Alert } from '@/ui/Alert/Alert';
import { Icon } from '@/ui/Icon/Icon';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/app/router/routes';
import { LIFE_AREAS, LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import type { Favorite, HistoryEntry } from '@/domain/activity/types';
import { lifeAreaColorVar } from '@/ui/tokens';
import { useCurrentHousehold, useHouseholdMembers } from '@/features/household/queries';
import { useCatalog, useFavorites, useHistory } from './queries';
import { AREA_ICON } from './areaIcons';
import { CaptureDialog } from './CaptureDialog';
import { FavoritesSection } from './FavoritesSection';
import { EntryCard } from '@/features/history/EntryCard';
import styles from './CapturePage.module.css';

interface CaptureTarget {
  area: LifeArea;
  favorite?: Favorite;
}

/** The productive capture hub: four equal areas, favourites, recent entries. */
export function CapturePage(): React.JSX.Element {
  const { user } = useAuth();
  const { data: current } = useCurrentHousehold();
  const householdId = current?.household.id;
  const { data: members = [] } = useHouseholdMembers(householdId);
  const catalog = useCatalog();
  const { data: favorites = [] } = useFavorites(householdId);
  const history = useHistory(householdId, catalog, !catalog.isLoading);

  const [target, setTarget] = useState<CaptureTarget | null>(null);

  const partner = useMemo(
    () => members.find((m) => m.userId !== user?.id && m.status === 'active') ?? null,
    [members, user?.id],
  );
  const names = useMemo(
    () => new Map(members.map((m) => [m.userId, m.displayName || 'Person'])),
    [members],
  );
  const recentEntries: HistoryEntry[] = history.data?.pages[0]?.entries.slice(0, 5) ?? [];
  const allLoaded = history.data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <Page
      documentTitle="Erfassen"
      heading="Erfassen"
      intro="Bewegung, Ernährung, Nachhaltigkeit und Tierwohl – schnell und ohne Druck."
      actions={
        <Link to={paths.history} className={styles.historyButton}>
          <Icon name="review" size={18} />
          <span>Zur Historie</span>
        </Link>
      }
    >
      <div className={styles.wrap}>
        {catalog.isError ? (
          <Alert tone="attention" role="alert">
            Die Erfassung konnte nicht geladen werden. Bitte prüfe deine Verbindung.
          </Alert>
        ) : null}

        <Section title="Was möchtest du erfassen?" headingLevel={2}>
          <ul className={styles.areaGrid}>
            {LIFE_AREAS.map((area) => {
              const meta = LIFE_AREA_META[area];
              return (
                <li key={area}>
                  <button
                    type="button"
                    className={styles.areaCard}
                    style={{ ['--area-color' as string]: lifeAreaColorVar[area] }}
                    onClick={() => setTarget({ area })}
                    disabled={catalog.isLoading}
                  >
                    <span className={styles.areaIcon} aria-hidden="true">
                      <Icon name={AREA_ICON[area]} size={26} />
                    </span>
                    <span className={styles.areaText}>
                      <span className={styles.areaLabel}>{meta.label}</span>
                      <span className={styles.areaDesc}>{meta.description}</span>
                    </span>
                    <span className={styles.areaPlus} aria-hidden="true">
                      <Icon name="capture" size={20} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>

        <FavoritesSection
          favorites={favorites}
          catalog={catalog}
          householdId={householdId}
          canManage={catalog.types.length > 0}
          onRun={(favorite) => setTarget({ area: favorite.area, favorite })}
        />

        <Section
          title="Zuletzt erfasst"
          headingLevel={2}
          action={
            recentEntries.length > 0 ? (
              <Link to={paths.history} className={styles.historyLink}>
                Alle ansehen
              </Link>
            ) : undefined
          }
        >
          {history.isLoading ? (
            <div className={styles.center}>
              <Spinner label="Einträge werden geladen" />
            </div>
          ) : recentEntries.length === 0 ? (
            <EmptyState
              icon={<Icon name="capture" size={28} />}
              title="Noch keine Einträge"
              description="Wähle oben einen Bereich, um euren ersten Eintrag zu erfassen."
            />
          ) : (
            <ul className={styles.recentList}>
              {recentEntries.map((entry) => (
                <li key={`${entry.kind}:${entry.id}`}>
                  <EntryCard entry={entry} names={names} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {target ? (
        <CaptureDialog
          open
          area={target.area}
          types={catalog.types}
          definitions={catalog.definitions}
          partner={partner}
          currentUserId={user?.id ?? ''}
          existingEntries={allLoaded}
          favorite={target.favorite}
          onClose={() => setTarget(null)}
        />
      ) : null}
    </Page>
  );
}
