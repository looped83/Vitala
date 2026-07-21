import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Textarea } from '@/ui/Form/Textarea';
import { Chip } from '@/ui/Chip/Chip';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { useToast } from '@/ui/Toast/ToastProvider';
import { isValidIsoDate, isFutureDay, todayInZone } from '@/lib/dates/day';
import { NOTE_MAX } from '@/domain/activity/types';
import type { HistoryEntry, RitualDefinition } from '@/domain/activity/types';
import { findDuplicateHint } from '@/domain/activity/history';
import { LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import { ParticipantField } from './ParticipantField';
import type { ParticipantValue } from './ParticipantField';
import type { HouseholdMemberWithProfile } from '@/data/repositories/household';
import { useSaveRitual } from './queries';
import styles from './RitualForm.module.css';

type RitualArea = Exclude<LifeArea, 'movement'>;

const metaSchema = z.object({
  occurred_on: z
    .string()
    .refine(isValidIsoDate, 'Bitte ein gültiges Datum wählen.')
    .refine((v) => !isFutureDay(v), 'Das Datum darf nicht in der Zukunft liegen.'),
  meal_label: z.string().trim().max(80, 'Höchstens 80 Zeichen.').optional(),
  note: z.string().trim().max(NOTE_MAX, `Höchstens ${NOTE_MAX} Zeichen.`).optional(),
});
type MetaValues = z.infer<typeof metaSchema>;

export interface RitualFormProps {
  area: RitualArea;
  definitions: RitualDefinition[];
  partner: HouseholdMemberWithProfile | null;
  currentUserId: string;
  existingEntries: HistoryEntry[];
  initial?: HistoryEntry;
  prefill?: { definitionIds?: string[]; isShared?: boolean };
  onSaved: () => void;
}

export function RitualForm({
  area,
  definitions,
  partner,
  currentUserId,
  existingEntries,
  initial,
  prefill,
  onSaved,
}: RitualFormProps): React.JSX.Element {
  const toast = useToast();
  const saveRitual = useSaveRitual();
  const isEdit = Boolean(initial);
  const keepOpen = useRef(false);

  const areaDefs = useMemo(
    () => definitions.filter((d) => d.area === area).sort((a, b) => a.sortOrder - b.sortOrder),
    [definitions, area],
  );
  const dailyDefs = areaDefs.filter((d) => d.kind === 'daily_block');
  const specialDefs = areaDefs.filter((d) => d.kind === 'special_action');

  const initialIds = initial
    ? areaDefs.filter((d) => initial.definitionKeys?.includes(d.key)).map((d) => d.id)
    : (prefill?.definitionIds ?? []);

  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantValue>({
    isShared: initial?.isShared ?? prefill?.isShared ?? false,
    partnerUserId:
      initial?.isShared || prefill?.isShared ? (partner?.userId ?? undefined) : undefined,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MetaValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      occurred_on: initial?.occurredOn ?? todayInZone(),
      meal_label: initial?.mealLabel ?? undefined,
      note: initial?.note ?? undefined,
    },
  });

  const watchedDate = watch('occurred_on');

  function toggle(id: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectionError(null);
  }

  const duplicate = useMemo(() => {
    const keys = areaDefs.filter((d) => selected.has(d.id)).map((d) => d.key);
    if (keys.length === 0 || !watchedDate) return null;
    return findDuplicateHint(existingEntries, {
      area,
      occurredOn: watchedDate,
      userId: currentUserId,
      definitionKeys: keys,
      ignoreId: initial?.id,
    });
  }, [areaDefs, selected, watchedDate, existingEntries, area, currentUserId, initial?.id]);

  const submit = handleSubmit(async (values) => {
    if (selected.size === 0) {
      setSelectionError('Bitte mindestens einen Eintrag auswählen.');
      return;
    }
    try {
      await saveRitual.mutateAsync({
        groupId: initial?.id ?? null,
        area,
        definitionIds: [...selected],
        occurredOn: values.occurred_on,
        note: values.note || null,
        mealLabel: area === 'nutrition' ? values.meal_label || null : null,
        isShared: participant.isShared,
        partnerUserId: participant.isShared ? (participant.partnerUserId ?? null) : null,
      });
      toast.show(
        isEdit ? 'Eintrag aktualisiert.' : `${LIFE_AREA_META[area].label} wurde gespeichert.`,
        'success',
      );
      if (keepOpen.current && !isEdit) {
        setSelected(new Set());
        setParticipant({ isShared: false, partnerUserId: undefined });
        reset({ occurred_on: todayInZone(), meal_label: undefined, note: undefined });
      } else {
        onSaved();
      }
    } catch {
      toast.show(
        'Der Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.',
        'attention',
      );
    }
  });

  const renderChips = (defs: RitualDefinition[], legend: string): React.JSX.Element | null =>
    defs.length === 0 ? null : (
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{legend}</legend>
        <div className={styles.chips}>
          {defs.map((def) => (
            <Chip key={def.id} pressed={selected.has(def.id)} onClick={() => toggle(def.id)}>
              {def.name}
            </Chip>
          ))}
        </div>
      </fieldset>
    );

  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <FormField label="Datum" error={errors.occurred_on?.message} required>
        <Input type="date" max={todayInZone()} {...register('occurred_on')} />
      </FormField>

      {renderChips(dailyDefs, area === 'nutrition' ? 'Bausteine' : 'Alltagshandlungen')}
      {renderChips(specialDefs, 'Größere Aktionen')}
      {selectionError ? (
        <p role="alert" className={styles.selectionError}>
          {selectionError}
        </p>
      ) : null}

      {area === 'nutrition' ? (
        <FormField label="Mahlzeit (optional)" error={errors.meal_label?.message}>
          <Input maxLength={80} placeholder="z. B. Mittagessen" {...register('meal_label')} />
        </FormField>
      ) : null}

      <ParticipantField partner={partner} value={participant} onChange={setParticipant} />

      <FormField
        label="Notiz (optional)"
        description={`Nur für euch – höchstens ${NOTE_MAX} Zeichen.`}
        error={errors.note?.message}
      >
        <Textarea maxLength={NOTE_MAX} {...register('note')} />
      </FormField>

      {duplicate ? (
        <Alert tone="info">
          Für diesen Tag ist bereits ein ähnlicher Eintrag erfasst. Du kannst ihn trotzdem
          speichern.
        </Alert>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-8)',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        {!isEdit ? (
          <Button
            type="submit"
            variant="secondary"
            loading={isSubmitting}
            onClick={() => {
              keepOpen.current = true;
            }}
          >
            Speichern & weiter
          </Button>
        ) : null}
        <Button
          type="submit"
          loading={isSubmitting}
          onClick={() => {
            keepOpen.current = false;
          }}
        >
          {isEdit ? 'Änderungen speichern' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
