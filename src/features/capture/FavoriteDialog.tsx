import { useState } from 'react';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { Chip } from '@/ui/Chip/Chip';
import { Switch } from '@/ui/Form/Switch';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { useToast } from '@/ui/Toast/ToastProvider';
import { LIFE_AREAS, LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import { INTENSITIES, INTENSITY_LABEL } from '@/domain/activity/types';
import type { ActivityType, Favorite, RitualDefinition } from '@/domain/activity/types';
import { useSaveFavorite } from './queries';
import styles from './RitualForm.module.css';

export interface FavoriteDialogProps {
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] };
  householdId: string | undefined;
  favorite?: Favorite;
  onClose: () => void;
}

const AREA_OPTIONS = LIFE_AREAS.map((a) => ({ value: a, label: LIFE_AREA_META[a].label }));
const INTENSITY_OPTIONS = [
  { value: '', label: 'Keine Angabe' },
  ...INTENSITIES.map((i) => ({ value: i, label: INTENSITY_LABEL[i] })),
];

export function FavoriteDialog({
  catalog,
  favorite,
  onClose,
}: FavoriteDialogProps): React.JSX.Element {
  const toast = useToast();
  const saveFavorite = useSaveFavorite();
  const isEdit = Boolean(favorite);

  const [area, setArea] = useState<LifeArea>(favorite?.area ?? 'movement');
  const [label, setLabel] = useState(favorite?.label ?? '');
  const [typeId, setTypeId] = useState(favorite?.activityTypeId ?? catalog.types[0]?.id ?? '');
  const [duration, setDuration] = useState<number>(favorite?.durationMin ?? 30);
  const [intensity, setIntensity] = useState<string>(favorite?.intensity ?? '');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(favorite?.ritualDefinitionIds ?? []),
  );
  const [isShared, setIsShared] = useState(favorite?.isShared ?? false);
  const [personal, setPersonal] = useState(favorite ? favorite.ownerUserId !== null : false);
  const [error, setError] = useState<string | null>(null);

  const areaDefs = catalog.definitions
    .filter((d) => d.area === area)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function toggle(id: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(): Promise<void> {
    if (label.trim().length === 0) {
      setError('Bitte einen Namen angeben.');
      return;
    }
    if (area === 'movement' ? !typeId : selected.size === 0) {
      setError('Bitte den Favoriten vervollständigen.');
      return;
    }
    try {
      await saveFavorite.mutateAsync({
        id: favorite?.id ?? null,
        area,
        label: label.trim(),
        activityTypeId: area === 'movement' ? typeId : null,
        durationMin: area === 'movement' ? duration : null,
        intensity:
          area === 'movement' && intensity ? (intensity as 'light' | 'medium' | 'intense') : null,
        ritualDefinitionIds: area === 'movement' ? [] : [...selected],
        isShared,
        personal,
      });
      toast.show(isEdit ? 'Favorit aktualisiert.' : 'Favorit gespeichert.', 'success');
      onClose();
    } catch {
      toast.show('Der Favorit konnte nicht gespeichert werden.', 'attention');
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? 'Favorit bearbeiten' : 'Neuer Favorit'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button loading={saveFavorite.isPending} onClick={() => void submit()}>
            Speichern
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-16)' }}>
        <FormField label="Bereich">
          <Select
            options={AREA_OPTIONS}
            value={area}
            onChange={(e) => setArea(e.target.value as LifeArea)}
          />
        </FormField>

        <FormField label="Name" error={error ?? undefined} required>
          <Input value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />
        </FormField>

        {area === 'movement' ? (
          <>
            <FormField label="Aktivitätstyp">
              <Select
                options={catalog.types.map((t) => ({ value: t.id, label: t.name }))}
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
              />
            </FormField>
            <FormField label="Dauer (Minuten)">
              <Input
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </FormField>
            <RadioGroup
              legend="Intensität"
              value={intensity}
              options={INTENSITY_OPTIONS}
              onValueChange={setIntensity}
            />
          </>
        ) : (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Bausteine</legend>
            <div className={styles.chips}>
              {areaDefs.map((def) => (
                <Chip key={def.id} pressed={selected.has(def.id)} onClick={() => toggle(def.id)}>
                  {def.name}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        <Switch
          label="Als gemeinsame Erfassung vorbelegen"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
        />
        <Switch
          label="Nur für mich"
          description="Ausgeschaltet: für den ganzen Household sichtbar."
          checked={personal}
          onChange={(e) => setPersonal(e.target.checked)}
        />
      </div>
    </Dialog>
  );
}
