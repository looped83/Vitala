import { useMemo, useState } from 'react';
import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Card } from '@/ui/Card/Card';
import { Chip } from '@/ui/Chip/Chip';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { Spinner } from '@/ui/Spinner/Spinner';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { todayInZone } from '@/lib/dates/day';
import {
  useCurrentHousehold,
  useHouseholdMembers,
  useHouseholdSettings,
} from '@/features/household/queries';
import { useCatalog } from '@/features/capture/queries';
import { EntryCard } from '@/features/history/EntryCard';
import { formatPeriodLabel } from '@/features/goals/periodLabel';
import { currentPeriodBounds } from '@/domain/goals/periods';
import type { GoalPeriodType } from '@/domain/goals/types';
import { balanceText, comparisonText, daySummaryText } from '@/domain/review/aggregate';
import type { AreaTotals } from '@/domain/review/aggregate';
import { useCheckIn } from '@/features/checkins/queries';
import { DAY_FEELING_LABEL, DAY_FOCUS_LABEL, ENERGY_LABEL } from '@/domain/checkins/types';
import { useReviewData } from './queries';
import { BalanceBars } from './BalanceBars';
import styles from './ReviewPage.module.css';

type Scope = 'day' | 'week' | 'month';

const SCOPE_LABEL: Record<Scope, string> = { day: 'Tag', week: 'Woche', month: 'Monat' };
const PERIOD_WORD: Record<Scope, string> = {
  day: 'Heute',
  week: 'Diese Woche',
  month: 'Diesen Monat',
};

function shift(anchor: string, scope: Scope, dir: -1 | 1): string {
  const [y, m, d] = anchor.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  if (scope === 'day') dt.setUTCDate(dt.getUTCDate() + dir);
  else if (scope === 'week') dt.setUTCDate(dt.getUTCDate() + dir * 7);
  else dt.setUTCMonth(dt.getUTCMonth() + dir);
  return dt.toISOString().slice(0, 10);
}

export function ReviewPage(): React.JSX.Element {
  const today = todayInZone();
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  const { data: members } = useHouseholdMembers(householdId);
  const { data: settings } = useHouseholdSettings(householdId);
  const weekStart = settings?.week_start ?? 1;
  const catalog = useCatalog();

  const [scope, setScope] = useState<Scope>('week');
  const [anchor, setAnchor] = useState(today);

  const bounds = useMemo(
    () => currentPeriodBounds(scope as GoalPeriodType, anchor, anchor, weekStart),
    [scope, anchor, weekStart],
  );
  const prevAnchor = shift(anchor, scope, -1);
  const prevBounds = useMemo(
    () => currentPeriodBounds(scope as GoalPeriodType, prevAnchor, prevAnchor, weekStart),
    [scope, prevAnchor, weekStart],
  );

  const review = useReviewData(
    householdId,
    scope,
    bounds.start,
    bounds.end,
    catalog,
    !catalog.isLoading,
  );
  const prevReview = useReviewData(
    householdId,
    `${scope}-prev`,
    prevBounds.start,
    prevBounds.end,
    catalog,
    !catalog.isLoading && scope === 'month',
  );

  const morning = useCheckIn('morning', scope === 'day' ? anchor : today);
  const evening = useCheckIn('evening', scope === 'day' ? anchor : today);

  const namesById = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m.displayName])),
    [members],
  );

  const totals: AreaTotals | undefined = review.data?.totals;
  const isCurrent = anchor === today;
  const label = formatPeriodLabel(scope, bounds.start, bounds.end);

  return (
    <Page
      documentTitle="Rückblick"
      heading="Rückblick"
      intro="Ein wertfreier Blick zurück – Tag, Woche und Monat."
    >
      <div className={styles.controls}>
        <div className={styles.scope} role="group" aria-label="Zeitraum wählen">
          {(['day', 'week', 'month'] as Scope[]).map((s) => (
            <Chip
              key={s}
              pressed={scope === s}
              onClick={() => {
                setScope(s);
                setAnchor(today);
              }}
            >
              {SCOPE_LABEL[s]}
            </Chip>
          ))}
        </div>
        <div className={styles.nav}>
          <IconButton
            label="Vorheriger Zeitraum"
            icon={<Icon name="arrowLeft" size={18} />}
            variant="surface"
            onClick={() => setAnchor(shift(anchor, scope, -1))}
          />
          <span className={styles.periodLabel} aria-live="polite">
            {label}
          </span>
          <IconButton
            label="Nächster Zeitraum"
            icon={<Icon name="arrowLeft" size={18} />}
            variant="surface"
            className={styles.rotate}
            onClick={() => setAnchor(shift(anchor, scope, 1))}
            disabled={isCurrent}
          />
        </div>
      </div>

      {review.isLoading || !totals ? (
        <div className={styles.loading}>
          <Spinner label="Rückblick wird geladen" />
        </div>
      ) : (
        <div className={styles.stack}>
          <Card className={styles.summaryCard}>
            <p className={styles.summary}>
              {scope === 'day'
                ? daySummaryText(totals, isCurrent)
                : balanceText(totals, isCurrent ? PERIOD_WORD[scope] : label)}
            </p>
          </Card>

          <Section title="Überblick">
            <dl className={styles.stats}>
              <Stat label="Einträge" value={totals.entryCount} />
              <Stat label="Aktive Tage" value={totals.activeDays} />
              <Stat label="Bewegungsminuten" value={totals.movementMinutes} />
              <Stat label="Gemeinsame Einträge" value={totals.sharedCount} />
              <Stat label="Rituale abgeschlossen" value={totals.ritualsCompleted} />
            </dl>
          </Section>

          <Section
            title="Balance der Bereiche"
            description="Neutrale Verteilung – keine Bewertung."
          >
            <BalanceBars totals={totals} />
          </Section>

          {scope === 'month' && prevReview.data ? (
            <Section title="Im Vergleich zum Vormonat">
              <ul className={styles.compare}>
                <li>
                  {comparisonText({
                    current: totals.sharedCount,
                    previous: prevReview.data.totals.sharedCount,
                    nounSingular: 'gemeinsame Aktivität',
                    nounPlural: 'gemeinsame Aktivitäten',
                  })}
                </li>
                <li>
                  {comparisonText({
                    current: totals.byArea.sustainability,
                    previous: prevReview.data.totals.byArea.sustainability,
                    nounSingular: 'Nachhaltigkeitsaktion',
                    nounPlural: 'Nachhaltigkeitsaktionen',
                  })}
                </li>
              </ul>
            </Section>
          ) : null}

          {scope === 'day' && (morning.data || evening.data) ? (
            <Section title="Deine Check-ins" description="Privat – nur für dich sichtbar.">
              <div className={styles.checkins}>
                {morning.data ? (
                  <Card className={styles.checkinCard}>
                    <h3 className={styles.checkinTitle}>Morgen</h3>
                    {morning.data.energyLevel ? (
                      <p className={styles.checkinLine}>
                        Energie: {ENERGY_LABEL[morning.data.energyLevel]}
                      </p>
                    ) : null}
                    {morning.data.focus ? (
                      <p className={styles.checkinLine}>
                        Fokus: {DAY_FOCUS_LABEL[morning.data.focus]}
                      </p>
                    ) : null}
                    {morning.data.wishText ? (
                      <p className={styles.checkinText}>{morning.data.wishText}</p>
                    ) : null}
                  </Card>
                ) : null}
                {evening.data ? (
                  <Card className={styles.checkinCard}>
                    <h3 className={styles.checkinTitle}>Abend</h3>
                    {evening.data.dayFeeling ? (
                      <p className={styles.checkinLine}>
                        Tagesgefühl: {DAY_FEELING_LABEL[evening.data.dayFeeling]}
                      </p>
                    ) : null}
                    {evening.data.positiveMoment ? (
                      <p className={styles.checkinText}>„{evening.data.positiveMoment}“</p>
                    ) : null}
                    {evening.data.reflectionGood ? (
                      <p className={styles.checkinText}>{evening.data.reflectionGood}</p>
                    ) : null}
                  </Card>
                ) : null}
              </div>
            </Section>
          ) : null}

          {scope === 'day' ? (
            <Section title="Einträge">
              {review.data && review.data.entries.length > 0 ? (
                <div className={styles.entries}>
                  {review.data.entries.map((e) => (
                    <EntryCard key={`${e.kind}:${e.id}`} entry={e} names={namesById} />
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>An diesem Tag wurde nichts dokumentiert.</p>
              )}
            </Section>
          ) : null}

          {totals.entryCount === 0 && totals.ritualsCompleted === 0 && scope !== 'day' ? (
            <EmptyState
              icon={<Icon name="review" size={28} />}
              title="Noch nichts in diesem Zeitraum"
              description="Sobald ihr etwas erfasst, entsteht hier euer Rückblick."
            />
          ) : null}
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>{value}</dd>
    </div>
  );
}
