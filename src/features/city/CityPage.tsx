import { useMemo, useState } from 'react';
import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Card } from '@/ui/Card/Card';
import { Alert } from '@/ui/Alert/Alert';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { Spinner } from '@/ui/Spinner/Spinner';
import { Drawer } from '@/ui/Drawer/Drawer';
import { Link } from '@/ui/Link/Link';
import { todayInZone } from '@/lib/dates/day';
import { paths } from '@/app/router/routes';
import { useCurrentHousehold } from '@/features/household/queries';
import { ResourceStrip } from '@/features/rewards/ResourceStrip';
import { BalanceCard } from '@/features/rewards/BalanceCard';
import { useResourceBalances, useSyncRewards, useWeeklyBalance } from '@/features/rewards/queries';
import { buildCityModel } from '@/domain/city/model';
import { getSlotDefinition } from '@/domain/city/layout';
import { slotSizeLabel } from '@/domain/city/display';
import { resolveCityView } from '@/domain/city/view';
import type { ResolvedCityView } from '@/domain/city/view';
import type { RegionId } from '@/domain/city/types';
import { useCityActions, useCityOverview } from './queries';
import { CityHeader } from './CityHeader';
import { CityMap } from './CityMap';
import { CityList } from './CityList';
import { CityDetail } from './CityDetail';
import { CityWorldStatus } from './CityWorldStatus';
import { UnlockBanner } from './UnlockBanner';
import { RenameCityDialog } from './RenameCityDialog';
import { useIsDesktop } from './useIsDesktop';
import type { CitySelection } from './selection';
import styles from './city.module.css';

const ZOOM_STEPS = [1, 1.5, 2] as const;

/**
 * The city & world view (Phase 6). A real, data-driven, interactive top-down
 * map with an equivalent list, a shared detail panel, resources, world status
 * and calm unlock notices. No fake buildings, no resource spending — the visual
 * and technical base for Phase 7.
 */
export function CityPage(): React.JSX.Element {
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  const weekAnchor = todayInZone();

  useSyncRewards(Boolean(householdId));
  const overview = useCityOverview(householdId);
  const resources = useResourceBalances(householdId);
  const balance = useWeeklyBalance(householdId, weekAnchor);
  const actions = useCityActions(householdId);
  const isDesktop = useIsDesktop();

  const [selection, setSelection] = useState<CitySelection>(null);
  const [viewOverride, setViewOverride] = useState<ResolvedCityView | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [renameOpen, setRenameOpen] = useState(false);

  const model = useMemo(
    () => (overview.data ? buildCityModel(overview.data.state, overview.data.seenLevel) : null),
    [overview.data],
  );

  const view: ResolvedCityView =
    viewOverride ?? (overview.data ? resolveCityView(overview.data.viewMode) : 'map');

  const lastUnlocked = useMemo(() => {
    if (!model) return null;
    const unlocked = model.regions
      .filter((r) => r.status !== 'locked' && r.definition.unlockLevel > 1)
      .sort((a, b) => b.definition.unlockLevel - a.definition.unlockLevel);
    return unlocked[0]?.definition.title ?? null;
  }, [model]);

  const changeView = (next: ResolvedCityView): void => {
    setViewOverride(next);
    void actions.setViewMode(next);
  };

  const selectRegion = (regionId: RegionId): void => setSelection({ kind: 'region', regionId });
  const selectSlot = (slotId: string): void => setSelection({ kind: 'slot', slotId });
  const clearSelection = (): void => setSelection(null);

  const dismissUnlock = (): void => {
    void actions.acknowledgeLevel();
  };

  const detailTitle = useMemo(() => {
    if (!selection || !model) return 'Details';
    if (selection.kind === 'region') {
      return (
        model.regions.find((r) => r.definition.id === selection.regionId)?.definition.title ??
        'Stadtbereich'
      );
    }
    const slot = getSlotDefinition(selection.slotId);
    return slot ? slotSizeLabel(slot.size) : 'Baufläche';
  }, [selection, model]);

  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;

  if (overview.isLoading || !model) {
    if (overview.isError) {
      return (
        <Page documentTitle="Stadt" heading="Stadt">
          <Alert tone="attention" role="alert" title="Die Stadt konnte nicht geladen werden">
            Bitte versucht es erneut.{' '}
            <Button variant="secondary" onClick={() => void overview.refetch()}>
              Erneut laden
            </Button>
          </Alert>
        </Page>
      );
    }
    return (
      <Page documentTitle="Stadt" heading="Stadt">
        <Spinner label="Stadt wird geladen" />
      </Page>
    );
  }

  const detailPanel = <CityDetail model={model} selection={selection} />;

  return (
    <Page documentTitle={`${model.state.name} · Stadt`} heading={model.state.name}>
      <div className={styles.page}>
        <CityHeader
          model={model}
          view={view}
          onChangeView={changeView}
          onRename={() => setRenameOpen(true)}
        />

        <UnlockBanner regions={model.newlyUnlocked} onDismiss={dismissUnlock} />

        <div className={`${styles.stage} ${isDesktop && selection ? styles.stageWithPanel : ''}`}>
          <div>
            {view === 'map' ? (
              <Card className={styles.mapCard}>
                <div className={styles.mapToolbar}>
                  <p className={styles.stageLine} aria-hidden>
                    Wähle einen Bereich oder eine Baufläche.
                  </p>
                  <div className={styles.zoomControls}>
                    <IconButton
                      label="Herauszoomen"
                      icon={<Icon name="minus" size={18} />}
                      onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                      disabled={zoomIndex === 0}
                    />
                    <span aria-live="polite">{Math.round(zoom * 100)}%</span>
                    <IconButton
                      label="Hineinzoomen"
                      icon={<Icon name="plus" size={18} />}
                      onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                      disabled={zoomIndex === ZOOM_STEPS.length - 1}
                    />
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setZoomIndex(0);
                        clearSelection();
                      }}
                    >
                      Zurücksetzen
                    </Button>
                  </div>
                </div>
                <CityMap
                  model={model}
                  selection={selection}
                  onSelectRegion={selectRegion}
                  onSelectSlot={selectSlot}
                  zoom={zoom}
                />
              </Card>
            ) : (
              <CityList model={model} onSelectRegion={selectRegion} onSelectSlot={selectSlot} />
            )}
          </div>

          {isDesktop && selection ? (
            <aside className={styles.detailPanelDesktop} aria-label={`Details: ${detailTitle}`}>
              <Card>
                <div className={styles.mapToolbar}>
                  <strong>{detailTitle}</strong>
                  <IconButton
                    label="Auswahl schließen"
                    icon={<Icon name="close" size={18} />}
                    onClick={clearSelection}
                  />
                </div>
                {detailPanel}
              </Card>
            </aside>
          ) : null}
        </div>

        <Section
          title="Ressourcen der Stadt"
          description="Diese Ressourcen entstehen aus euren Beiträgen und bauen später eure Gebäude."
        >
          {resources.data ? <ResourceStrip balances={resources.data} showHint /> : null}
          <p className={styles.stageLine}>
            Energie → Bewegung · Nahrung → Ernährung · Natur → Nachhaltigkeit & Tierwohl ·
            Gemeinschaft → Stadtzentrum & Kultur. <Link to={paths.review}>Verlauf ansehen</Link>
          </p>
        </Section>

        <Section title="Weltstatus" description="Ein ruhiger Überblick über eure Stadt.">
          <CityWorldStatus model={model} lastUnlocked={lastUnlocked} />
        </Section>

        <Section title="Diese Woche" description="Ausgewogenheit über die vier Bereiche.">
          <BalanceCard balance={balance.data ?? null} />
        </Section>
      </div>

      {!isDesktop ? (
        <Drawer
          open={Boolean(selection)}
          onClose={clearSelection}
          title={detailTitle}
          side="bottom"
        >
          {detailPanel}
        </Drawer>
      ) : null}

      <RenameCityDialog
        open={renameOpen}
        currentName={model.state.name}
        onClose={() => setRenameOpen(false)}
        onSubmit={actions.rename}
      />
    </Page>
  );
}
