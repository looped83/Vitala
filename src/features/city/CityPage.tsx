import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Card } from '@/ui/Card/Card';
import { Spinner } from '@/ui/Spinner/Spinner';
import { todayInZone } from '@/lib/dates/day';
import { useCurrentHousehold } from '@/features/household/queries';
import { LevelCard } from '@/features/rewards/LevelCard';
import { ResourceStrip } from '@/features/rewards/ResourceStrip';
import { BalanceCard } from '@/features/rewards/BalanceCard';
import {
  useCityStatus,
  useResourceBalances,
  useSyncRewards,
  useWeeklyBalance,
} from '@/features/rewards/queries';

/**
 * "Stadt" — a high-quality progress base (§53). Shows the shared city level,
 * resources and this week's balance, and prepares Phase 6/7 without any faked
 * buildings, map or city graphics.
 */
export function CityPage(): React.JSX.Element {
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  const weekStartAnchor = todayInZone();

  useSyncRewards(Boolean(householdId));
  const city = useCityStatus(householdId);
  const resources = useResourceBalances(householdId);
  const balance = useWeeklyBalance(householdId, weekStartAnchor);

  return (
    <Page
      documentTitle="Stadt"
      heading="Stadt"
      intro="Eure gemeinsame Stadt wächst mit euren Beiträgen über Wochen und Monate."
    >
      <div style={{ display: 'grid', gap: 'var(--space-24)' }}>
        <Section title="Stadtfortschritt" description="Euer gemeinsames Stadtlevel.">
          {city.isLoading ? (
            <Spinner label="Stadtlevel wird geladen" />
          ) : city.data ? (
            <LevelCard status={city.data} heading="Eure Stadt" scopeLabel="Stadtlevel" />
          ) : null}
        </Section>

        <Section
          title="Ressourcen"
          description="Gesammelt aus euren Beiträgen in allen vier Lebensbereichen."
        >
          {resources.data ? <ResourceStrip balances={resources.data} showHint /> : null}
        </Section>

        <Section title="Diese Woche" description="Ausgewogenheit über die vier Bereiche.">
          <BalanceCard balance={balance.data ?? null} />
        </Section>

        <Card>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Mit euren gesammelten Ressourcen entsteht in der nächsten Entwicklungsphase die
            begehbare Stadtansicht – mit Gebäuden, Natur und einer barrierefreien Strukturansicht.
          </p>
        </Card>
      </div>
    </Page>
  );
}
