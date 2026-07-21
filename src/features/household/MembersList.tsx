import { Avatar } from '@/ui/Avatar/Avatar';
import { Badge } from '@/ui/Badge/Badge';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { ROLE_LABELS } from '@/domain/household/roles';
import { lifeAreaColorVar } from '@/ui/tokens';
import type { LifeArea } from '@/ui/tokens';
import { useHouseholdMembers } from './queries';
import styles from './MembersList.module.css';

/** Read-only roster of the household's members (owner + member). */
export function MembersList({ householdId }: { householdId: string }): React.JSX.Element {
  const { data: members, isLoading } = useHouseholdMembers(householdId);

  if (isLoading) {
    return (
      <ul className={styles.list}>
        {[0, 1].map((i) => (
          <li key={i} className={styles.item}>
            <Skeleton width="40px" height="40px" radius="var(--radius-full)" />
            <Skeleton width="8rem" height="1rem" />
          </li>
        ))}
      </ul>
    );
  }

  const active = (members ?? []).filter((member) => member.status === 'active');

  return (
    <ul className={styles.list}>
      {active.map((member) => (
        <li key={member.id} className={styles.item}>
          <Avatar
            name={member.displayName || 'Mitglied'}
            accentColor={lifeAreaColorVar[member.accentColor as LifeArea] ?? undefined}
            size="md"
          />
          <span className={styles.name}>{member.displayName || 'Mitglied'}</span>
          <Badge tone={member.role === 'owner' ? 'primary' : 'neutral'}>
            {ROLE_LABELS[member.role]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
