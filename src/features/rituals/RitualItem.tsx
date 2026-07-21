import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { Badge } from '@/ui/Badge/Badge';
import { useToast } from '@/ui/Toast/ToastProvider';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import type { Ritual, RitualCompletion } from '@/domain/rituals/types';
import { COMPLETION_STATUS_LABEL } from '@/domain/rituals/types';
import { useClearRitualCompletion, useCompleteRitual } from './queries';
import styles from './RitualItem.module.css';

export interface RitualItemProps {
  ritual: Ritual;
  completion: RitualCompletion | null;
  date: string;
  /** Display name of who completed a shared ritual (optional). */
  completedByName?: string;
}

export function RitualItem({
  ritual,
  completion,
  date,
  completedByName,
}: RitualItemProps): React.JSX.Element {
  const toast = useToast();
  const complete = useCompleteRitual();
  const clear = useClearRitualCompletion();

  const status = completion?.status ?? 'open';
  const busy = complete.isPending || clear.isPending;

  function setStatus(next: 'done' | 'skipped'): void {
    complete.mutate(
      { ritualId: ritual.id, occurredOn: date, status: next },
      { onError: (e) => toast.show(getAppErrorMessage(e), 'attention') },
    );
  }

  function reset(): void {
    clear.mutate(
      { ritualId: ritual.id, occurredOn: date },
      { onError: (e) => toast.show(getAppErrorMessage(e), 'attention') },
    );
  }

  return (
    <li className={styles.item} data-status={status}>
      <span className={styles.left}>
        {ritual.lifeArea ? (
          <LifeAreaBadge area={ritual.lifeArea} iconOnly size={16} />
        ) : (
          <Icon name="ritual" size={18} aria-hidden />
        )}
        <span className={styles.text}>
          <span className={styles.title}>{ritual.title}</span>
          <span className={styles.sub}>
            {ritual.ownerType === 'shared' ? 'Gemeinsam' : 'Persönlich'}
            {status === 'done' && completedByName ? ` · von ${completedByName}` : ''}
          </span>
        </span>
      </span>

      <span className={styles.actions}>
        {status === 'open' ? (
          <>
            <Button
              size="md"
              onClick={() => setStatus('done')}
              loading={busy}
              leadingIcon={<Icon name="check" size={18} />}
            >
              Erledigt
            </Button>
            <Button variant="ghost" onClick={() => setStatus('skipped')} disabled={busy}>
              Überspringen
            </Button>
          </>
        ) : (
          <>
            <Badge tone={status === 'done' ? 'success' : 'neutral'}>
              {COMPLETION_STATUS_LABEL[status]}
            </Badge>
            <IconButton
              label="Zurücksetzen"
              icon={<Icon name="close" size={18} />}
              variant="ghost"
              onClick={reset}
              disabled={busy}
            />
          </>
        )}
      </span>
    </li>
  );
}
