import { Spinner } from '@/ui/Spinner/Spinner';
import { MissionCard } from './MissionCard';
import { useMissionActions, useMissionBoard } from './queries';
import type { MissionBoardItem } from '@/data/repositories/rewards';
import styles from './rewards.module.css';

export interface MissionsPanelProps {
  householdId: string | undefined;
  /** Only show the daily missions (Today), or everything (Missions view). */
  period?: 'day' | 'week' | 'all';
  enabled?: boolean;
}

function relevant(items: MissionBoardItem[], period: 'day' | 'week' | 'all'): MissionBoardItem[] {
  const live = items.filter(
    (m) => m.status === 'active' || m.status === 'offered' || m.status === 'completed',
  );
  const filtered = period === 'all' ? live : live.filter((m) => m.period === period);
  // Personal first, then shared; completed sink to the bottom.
  return filtered.sort((a, b) => {
    const done = Number(a.status === 'completed') - Number(b.status === 'completed');
    if (done !== 0) return done;
    return Number(a.scope === 'shared') - Number(b.scope === 'shared');
  });
}

/**
 * The mission board (§50). Renders the caller's live missions with progress and
 * the swap/skip/complete actions. Deterministic, calm, freiwillig.
 */
export function MissionsPanel({
  householdId,
  period = 'day',
  enabled = true,
}: MissionsPanelProps): React.JSX.Element {
  const board = useMissionBoard(householdId, enabled);
  const actions = useMissionActions(householdId);

  if (board.isLoading) return <Spinner label="Missionen werden geladen" />;
  const missions = relevant(board.data ?? [], period);
  if (missions.length === 0) {
    return <p className={styles.missionDesc}>Für heute sind keine Missionen offen.</p>;
  }
  return (
    <div className={styles.txList}>
      {missions.map((m) => (
        <MissionCard
          key={m.assignmentId}
          mission={m}
          onSwap={actions.swap}
          onSkip={actions.skip}
          onComplete={actions.complete}
          disabled={actions.isPending}
        />
      ))}
    </div>
  );
}
