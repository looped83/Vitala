import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { useToast } from '@/ui/Toast/ToastProvider';
import type { HistoryEntry } from '@/domain/activity/types';
import { useDeleteEntry } from '@/features/capture/queries';

export interface DeleteEntryDialogProps {
  entry: HistoryEntry | null;
  onClose: () => void;
  /** Called after a successful delete (e.g. to also close a detail view). */
  onDeleted?: () => void;
}

/** Confirms a soft delete. Explains what is removed; shared entries affect both. */
export function DeleteEntryDialog({
  entry,
  onClose,
  onDeleted,
}: DeleteEntryDialogProps): React.JSX.Element | null {
  const toast = useToast();
  const deleteEntry = useDeleteEntry();
  if (!entry) return null;

  async function confirm(): Promise<void> {
    if (!entry) return;
    try {
      await deleteEntry.mutateAsync({ kind: entry.kind, id: entry.id });
      toast.show('Eintrag gelöscht.', 'success');
      onDeleted?.();
      onClose();
    } catch {
      toast.show('Der Eintrag konnte nicht gelöscht werden. Bitte erneut versuchen.', 'attention');
    }
  }

  const description = entry.isShared
    ? 'Dieser gemeinsame Eintrag wird für euch beide entfernt.'
    : 'Dieser Eintrag wird aus eurer Historie entfernt.';

  return (
    <Dialog
      open
      onClose={onClose}
      title={`„${entry.title}" löschen?`}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="danger" loading={deleteEntry.isPending} onClick={() => void confirm()}>
            Löschen
          </Button>
        </>
      }
    />
  );
}
