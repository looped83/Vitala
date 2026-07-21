import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { de } from 'date-fns/locale';
import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Card } from '@/ui/Card/Card';
import { Button } from '@/ui/Button/Button';
import { Badge } from '@/ui/Badge/Badge';
import { Icon } from '@/ui/Icon/Icon';
import { Link } from '@/ui/Link/Link';
import { Spinner } from '@/ui/Spinner/Spinner';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { paths } from '@/app/router/routes';
import { HOUSEHOLD_TIMEZONE, todayInZone } from '@/lib/dates/day';
import { useAuth } from '@/app/providers/AuthProvider';
import { useMyProfile } from '@/features/profile/queries';
import { useCurrentHousehold, useHouseholdMembers } from '@/features/household/queries';
import { useCatalog } from '@/features/capture/queries';
import { EntryCard } from '@/features/history/EntryCard';
import { GoalCard } from '@/features/goals/GoalCard';
import { goalOwnerLabel } from '@/features/goals/ownerLabel';
import { useGoalsOverview } from '@/features/goals/queries';
import { CheckInDialog } from '@/features/checkins/CheckInDialog';
import { useCheckIn } from '@/features/checkins/queries';
import { RitualItem } from '@/features/rituals/RitualItem';
import { RitualsManager } from '@/features/rituals/RitualsManager';
import { useRitualCompletions, useRituals } from '@/features/rituals/queries';
import { ritualsDueOn } from '@/domain/rituals/schedule';
import { useReviewData } from '@/features/review/queries';
import styles from './TodayPage.module.css';

function greetingFor(name: string | undefined, hour: number): string {
  const who = name ? `, ${name}` : '';
  if (hour < 11) return `Guten Morgen${who}.`;
  if (hour < 18) return `Schön, dass du da bist${who}.`;
  return `Guten Abend${who}.`;
}

export function TodayPage(): React.JSX.Element {
  const navigate = useNavigate();
  const today = todayInZone();
  const hour = Number(formatInTimeZone(new Date(), HOUSEHOLD_TIMEZONE, 'H'));
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  const { data: members } = useHouseholdMembers(householdId);
  const catalog = useCatalog();

  const goalsQuery = useGoalsOverview(householdId);
  const ritualsQuery = useRituals(householdId);
  const completionsQuery = useRitualCompletions(householdId, today, today);
  const morning = useCheckIn('morning', today);
  const evening = useCheckIn('evening', today);
  const review = useReviewData(householdId, 'day', today, today, catalog, !catalog.isLoading);

  const [checkIn, setCheckIn] = useState<null | 'morning' | 'evening'>(null);
  const [manageRituals, setManageRituals] = useState(false);

  const namesById = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m.displayName])),
    [members],
  );
  const formMembers = useMemo(
    () =>
      (members ?? [])
        .filter((m) => m.status === 'active')
        .map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members],
  );

  const activeGoals = (goalsQuery.data ?? []).filter((g) => g.status === 'active');
  const dueRituals = useMemo(
    () => ritualsDueOn(ritualsQuery.data ?? [], today),
    [ritualsQuery.data, today],
  );
  const completionByRitual = useMemo(
    () => new Map((completionsQuery.data ?? []).map((c) => [c.ritualId, c])),
    [completionsQuery.data],
  );

  const dateLabel = formatInTimeZone(new Date(), HOUSEHOLD_TIMEZONE, 'EEEE, d. MMMM', {
    locale: de,
  });
  const name = profile?.display_name?.trim();

  return (
    <Page documentTitle="Heute" heading="Heute" intro={dateLabel}>
      <p className={styles.greeting}>{greetingFor(name, hour)}</p>

      <div className={styles.stack}>
        <div className={styles.checkins}>
          <CheckInCard
            title="Morgen-Check-in"
            icon="sunrise"
            done={Boolean(morning.data)}
            onOpen={() => setCheckIn('morning')}
          />
          <CheckInCard
            title="Abend-Check-in"
            icon="sunset"
            done={Boolean(evening.data)}
            onOpen={() => setCheckIn('evening')}
          />
        </div>

        <Section title="Heutige Ziele" description="Freiwillig – kein Druck.">
          {goalsQuery.isLoading ? (
            <Spinner label="Ziele werden geladen" />
          ) : activeGoals.length > 0 ? (
            <div className={styles.goalGrid}>
              {activeGoals.slice(0, 6).map((g) => (
                <GoalCard key={g.id} goal={g} compact ownerLabel={goalOwnerLabel(g, namesById)} />
              ))}
            </div>
          ) : (
            <p className={styles.hint}>
              Noch keine aktiven Ziele. <Link to={paths.goals}>Ziel anlegen</Link>
            </p>
          )}
        </Section>

        <Section
          title="Heutige Rituale"
          action={
            <Button variant="ghost" onClick={() => setManageRituals(true)}>
              Verwalten
            </Button>
          }
        >
          {ritualsQuery.isLoading ? (
            <Spinner label="Rituale werden geladen" />
          ) : dueRituals.length > 0 ? (
            <ul className={styles.ritualList}>
              {dueRituals.map((r) => {
                const completion = completionByRitual.get(r.id) ?? null;
                return (
                  <RitualItem
                    key={r.id}
                    ritual={r}
                    completion={completion}
                    date={today}
                    completedByName={
                      completion ? (namesById.get(completion.userId) ?? undefined) : undefined
                    }
                  />
                );
              })}
            </ul>
          ) : (
            <p className={styles.hint}>
              Heute sind keine Rituale geplant.{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setManageRituals(true)}
              >
                Ritual anlegen
              </button>
            </p>
          )}
        </Section>

        <Section
          title="Heute erfasst"
          action={
            <Button
              variant="ghost"
              onClick={() => navigate(paths.capture)}
              leadingIcon={<Icon name="plus" size={18} />}
            >
              Erfassen
            </Button>
          }
        >
          {review.isLoading ? (
            <Spinner label="Einträge werden geladen" />
          ) : review.data && review.data.entries.length > 0 ? (
            <div className={styles.entries}>
              {review.data.entries.map((e) => (
                <EntryCard key={`${e.kind}:${e.id}`} entry={e} names={namesById} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Icon name="capture" size={28} />}
              title="Noch nichts erfasst"
              description="Halte fest, was du heute Gutes getan hast – ganz ohne Druck."
              action={<Button onClick={() => navigate(paths.capture)}>Etwas erfassen</Button>}
            />
          )}
        </Section>
      </div>

      {checkIn ? (
        <CheckInDialog type={checkIn} open={Boolean(checkIn)} onClose={() => setCheckIn(null)} />
      ) : null}

      {householdId ? (
        <RitualsManager
          householdId={householdId}
          members={formMembers}
          currentUserId={user?.id ?? ''}
          open={manageRituals}
          onClose={() => setManageRituals(false)}
        />
      ) : null}
    </Page>
  );
}

function CheckInCard({
  title,
  icon,
  done,
  onOpen,
}: {
  title: string;
  icon: 'sunrise' | 'sunset';
  done: boolean;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <Card className={styles.checkinCard}>
      <div className={styles.checkinHead}>
        <Icon name={icon} size={22} aria-hidden />
        <span className={styles.checkinTitle}>{title}</span>
        {done ? <Badge tone="success">Erledigt</Badge> : null}
      </div>
      <Button variant={done ? 'secondary' : 'primary'} onClick={onOpen}>
        {done ? 'Ansehen oder ändern' : 'Starten'}
      </Button>
    </Card>
  );
}
