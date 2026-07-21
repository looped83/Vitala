import { Icon } from '@/ui/Icon/Icon';
import { DropdownMenu } from '@/ui/Menu/DropdownMenu';
import { IconButton } from '@/ui/Button/IconButton';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import { entrySummary } from '@/domain/activity/summary';
import type { HistoryEntry } from '@/domain/activity/types';
import styles from './EntryCard.module.css';

export interface EntryCardProps {
  entry: HistoryEntry;
  /** userId → display name, for participant labels. */
  names: Map<string, string>;
  onOpen?: (entry: HistoryEntry) => void;
  onEdit?: (entry: HistoryEntry) => void;
  onDelete?: (entry: HistoryEntry) => void;
}

function participantLabel(entry: HistoryEntry, names: Map<string, string>): string {
  if (entry.isShared) {
    const people = entry.participantIds.map((id) => names.get(id) ?? 'Person');
    return people.length > 0 ? `Gemeinsam · ${people.join(' & ')}` : 'Gemeinsam';
  }
  return names.get(entry.primaryUserId) ?? 'Person';
}

/** One history entry as an accessible card. Colour is never the only signal. */
export function EntryCard({
  entry,
  names,
  onOpen,
  onEdit,
  onDelete,
}: EntryCardProps): React.JSX.Element {
  const summary = entrySummary(entry);
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <article className={styles.card}>
      <div className={styles.main}>
        <LifeAreaBadge area={entry.area} iconOnly size={18} />
        <div className={styles.body}>
          <p className={styles.title}>
            {onOpen ? (
              <button type="button" className={styles.titleButton} onClick={() => onOpen(entry)}>
                {entry.title}
              </button>
            ) : (
              entry.title
            )}
          </p>
          {summary ? <p className={styles.summary}>{summary}</p> : null}
          <p className={styles.meta}>
            <span className={styles.person}>
              {entry.isShared ? <Icon name="shared" size={14} /> : null}
              {participantLabel(entry, names)}
            </span>
            {entry.note ? <span className={styles.noteFlag}>Notiz</span> : null}
          </p>
        </div>
      </div>
      {hasActions ? (
        <DropdownMenu
          label={`Aktionen für ${entry.title}`}
          trigger={({ ref, ...props }) => (
            <IconButton
              ref={ref}
              label={`Aktionen für ${entry.title}`}
              icon={<Icon name="menu" size={18} />}
              variant="quiet"
              {...props}
            />
          )}
          items={[
            ...(onEdit
              ? [
                  {
                    id: 'edit',
                    label: 'Bearbeiten',
                    icon: <Icon name="edit" size={16} />,
                    onSelect: () => onEdit(entry),
                  },
                ]
              : []),
            ...(onDelete
              ? [
                  {
                    id: 'delete',
                    label: 'Löschen',
                    icon: <Icon name="trash" size={16} />,
                    tone: 'danger' as const,
                    onSelect: () => onDelete(entry),
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </article>
  );
}
