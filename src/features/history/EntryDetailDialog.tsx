import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import { INTENSITY_LABEL } from '@/domain/activity/types';
import type { HistoryEntry } from '@/domain/activity/types';
import { formatDateInZone, formatDateTime } from '@/lib/dates/format';
import { HOUSEHOLD_TIMEZONE } from '@/lib/dates/day';
import styles from './EntryDetailDialog.module.css';

export interface EntryDetailDialogProps {
  entry: HistoryEntry | null;
  names: Map<string, string>;
  onClose: () => void;
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className={styles.row}>
      <dt className={styles.term}>{label}</dt>
      <dd className={styles.desc}>{value}</dd>
    </div>
  );
}

/** Read-only detail of an entry with edit / delete actions (spec §23). */
export function EntryDetailDialog({
  entry,
  names,
  onClose,
  onEdit,
  onDelete,
}: EntryDetailDialogProps): React.JSX.Element | null {
  if (!entry) return null;
  const day = formatDateInZone(`${entry.occurredOn}T12:00:00Z`, HOUSEHOLD_TIMEZONE);
  const participants = entry.isShared
    ? entry.participantIds.map((id) => names.get(id) ?? 'Person').join(' & ')
    : (names.get(entry.primaryUserId) ?? 'Person');

  return (
    <Dialog
      open
      onClose={onClose}
      title={entry.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Zurück
          </Button>
          <Button variant="secondary" onClick={() => onEdit(entry)}>
            Bearbeiten
          </Button>
          <Button variant="danger" onClick={() => onDelete(entry)}>
            Löschen
          </Button>
        </>
      }
    >
      <dl className={styles.list}>
        <Row label="Bereich" value={<LifeAreaBadge area={entry.area} />} />
        <Row label="Datum" value={day} />
        {entry.startedAtTime ? (
          <Row label="Uhrzeit" value={entry.startedAtTime.slice(0, 5)} />
        ) : null}
        {entry.kind === 'activity' ? (
          <>
            <Row label="Dauer" value={`${entry.durationMin ?? 0} Minuten`} />
            {entry.intensity ? (
              <Row label="Intensität" value={INTENSITY_LABEL[entry.intensity]} />
            ) : null}
            {entry.location ? <Row label="Ort / Anbieter" value={entry.location} /> : null}
          </>
        ) : (
          <>
            {entry.mealLabel ? <Row label="Mahlzeit" value={entry.mealLabel} /> : null}
            <Row
              label={entry.area === 'nutrition' ? 'Bausteine' : 'Handlungen'}
              value={(entry.definitionLabels ?? []).join(', ')}
            />
          </>
        )}
        <Row label="Beteiligte" value={participants} />
        {entry.note ? (
          <Row label="Notiz" value={<span className={styles.note}>{entry.note}</span>} />
        ) : null}
        <Row label="Erfasst von" value={names.get(entry.createdBy) ?? 'Person'} />
        <Row label="Erstellt" value={formatDateTime(entry.createdAt)} />
        {entry.updatedAt !== entry.createdAt ? (
          <Row label="Zuletzt geändert" value={formatDateTime(entry.updatedAt)} />
        ) : null}
      </dl>
    </Dialog>
  );
}
