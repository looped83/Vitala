import { useState } from 'react';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { CITY_NAME_MAX, cityNameSchema } from '@/domain/city/name';

export interface RenameCityDialogProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

/**
 * Rename the household city (§21). Client-side validation mirrors the server
 * (length + no markup); the server re-validates and is the final authority.
 */
export function RenameCityDialog({
  open,
  currentName,
  onClose,
  onSubmit,
}: RenameCityDialogProps): React.JSX.Element {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = cityNameSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ungültiger Name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch {
      setError('Der Stadtname konnte nicht gespeichert werden. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Stadt umbenennen"
      description="Der Name gehört euch beiden und lässt sich jederzeit ändern."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={(e) => void handleSubmit(e)}
            loading={saving}
            form="rename-city-form"
            type="submit"
          >
            Speichern
          </Button>
        </>
      }
    >
      <form id="rename-city-form" onSubmit={(e) => void handleSubmit(e)}>
        <FormField label="Stadtname" error={error ?? undefined}>
          <Input
            value={value}
            maxLength={CITY_NAME_MAX}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
