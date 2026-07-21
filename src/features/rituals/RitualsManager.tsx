import { useMemo, useState } from 'react';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { Badge } from '@/ui/Badge/Badge';
import { DropdownMenu } from '@/ui/Menu/DropdownMenu';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { useToast } from '@/ui/Toast/ToastProvider';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import type { Ritual } from '@/domain/rituals/types';
import {
  RITUAL_RECURRENCE_LABEL,
  RITUAL_STATUS_LABEL,
  RITUAL_TIME_LABEL,
} from '@/domain/rituals/types';
import { RitualForm } from './RitualForm';
import type { RitualFormMember } from './RitualForm';
import { useDeleteRitual, useRituals, useSetRitualStatus } from './queries';
import styles from './RitualsManager.module.css';

export interface RitualsManagerProps {
  householdId: string;
  members: RitualFormMember[];
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}

export function RitualsManager({
  householdId,
  members,
  currentUserId,
  open,
  onClose,
}: RitualsManagerProps): React.JSX.Element {
  const toast = useToast();
  const ritualsQuery = useRituals(open ? householdId : undefined);
  const setStatus = useSetRitualStatus();
  const remove = useDeleteRitual();
  const [editing, setEditing] = useState<Ritual | null>(null);
  const [creating, setCreating] = useState(false);

  const rituals = useMemo(
    () => (ritualsQuery.data ?? []).filter((r) => r.status !== 'archived'),
    [ritualsQuery.data],
  );

  const showForm = creating || Boolean(editing);

  function close(): void {
    setCreating(false);
    setEditing(null);
    onClose();
  }

  function handleStatus(r: Ritual, status: 'active' | 'paused' | 'archived'): void {
    setStatus.mutate(
      { id: r.id, status },
      {
        onSuccess: () => toast.show('Ritual aktualisiert.', 'success'),
        onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
      },
    );
  }

  function handleDelete(r: Ritual): void {
    remove.mutate(r.id, {
      onSuccess: () => toast.show('Ritual gelöscht.', 'success'),
      onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={editing ? 'Ritual bearbeiten' : creating ? 'Neues Ritual' : 'Rituale verwalten'}
    >
      {showForm ? (
        <RitualForm
          ritual={editing}
          members={members}
          currentUserId={currentUserId}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : (
        <div className={styles.body}>
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<Icon name="plus" size={18} />}
            onClick={() => setCreating(true)}
          >
            Neues Ritual
          </Button>

          {rituals.length === 0 ? (
            <EmptyState
              icon={<Icon name="ritual" size={28} />}
              title="Noch keine Rituale"
              description="Lege kleine wiederkehrende Handlungen an – persönlich oder gemeinsam."
            />
          ) : (
            <ul className={styles.list}>
              {rituals.map((r) => (
                <li key={r.id} className={styles.row}>
                  <span className={styles.rowMain}>
                    {r.lifeArea ? (
                      <LifeAreaBadge area={r.lifeArea} iconOnly size={16} />
                    ) : (
                      <Icon name="ritual" size={18} aria-hidden />
                    )}
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{r.title}</span>
                      <span className={styles.rowSub}>
                        {RITUAL_RECURRENCE_LABEL[r.recurrence]} ·{' '}
                        {RITUAL_TIME_LABEL[r.preferredTime]} ·{' '}
                        {r.ownerType === 'shared' ? 'Gemeinsam' : 'Persönlich'}
                      </span>
                    </span>
                  </span>
                  <span className={styles.rowActions}>
                    {r.status !== 'active' ? (
                      <Badge tone="neutral">{RITUAL_STATUS_LABEL[r.status]}</Badge>
                    ) : null}
                    <DropdownMenu
                      label="Ritualoptionen"
                      items={[
                        { id: 'edit', label: 'Bearbeiten', onSelect: () => setEditing(r) },
                        r.status === 'paused'
                          ? {
                              id: 'resume',
                              label: 'Fortsetzen',
                              onSelect: () => handleStatus(r, 'active'),
                            }
                          : {
                              id: 'pause',
                              label: 'Pausieren',
                              onSelect: () => handleStatus(r, 'paused'),
                            },
                        {
                          id: 'archive',
                          label: 'Archivieren',
                          onSelect: () => handleStatus(r, 'archived'),
                        },
                        {
                          id: 'delete',
                          label: 'Löschen',
                          tone: 'danger' as const,
                          onSelect: () => handleDelete(r),
                        },
                      ]}
                      trigger={(props) => (
                        <IconButton
                          {...props}
                          label="Ritualoptionen"
                          icon={<Icon name="more" size={20} />}
                        />
                      )}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}
