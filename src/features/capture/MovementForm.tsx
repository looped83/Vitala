import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { Textarea } from '@/ui/Form/Textarea';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { useToast } from '@/ui/Toast/ToastProvider';
import { movementFormSchema } from '@/domain/activity/schemas';
import type { MovementFormValues } from '@/domain/activity/schemas';
import { INTENSITIES, INTENSITY_LABEL, NOTE_MAX } from '@/domain/activity/types';
import type { ActivityType, HistoryEntry } from '@/domain/activity/types';
import { findDuplicateHint } from '@/domain/activity/history';
import { todayInZone } from '@/lib/dates/day';
import { ParticipantField } from './ParticipantField';
import type { ParticipantValue } from './ParticipantField';
import type { HouseholdMemberWithProfile } from '@/data/repositories/household';
import { useSaveActivity } from './queries';

const INTENSITY_OPTIONS = [
  { value: '', label: 'Keine Angabe' },
  ...INTENSITIES.map((value) => ({ value, label: INTENSITY_LABEL[value] })),
];

export interface MovementFormProps {
  types: ActivityType[];
  partner: HouseholdMemberWithProfile | null;
  currentUserId: string;
  existingEntries: HistoryEntry[];
  /** Present when editing an existing entry. */
  initial?: HistoryEntry;
  /** Optional prefill from a favourite. */
  prefill?: {
    activityTypeId?: string;
    durationMin?: number | null;
    intensity?: 'light' | 'medium' | 'intense' | null;
    isShared?: boolean;
  };
  onSaved: () => void;
}

export function MovementForm({
  types,
  partner,
  currentUserId,
  existingEntries,
  initial,
  prefill,
  onSaved,
}: MovementFormProps): React.JSX.Element {
  const toast = useToast();
  const saveActivity = useSaveActivity();
  const isEdit = Boolean(initial);
  const keepOpen = useRef(false);

  const typeOptions = useMemo(() => types.map((t) => ({ value: t.id, label: t.name })), [types]);
  const initialTypeId =
    initial?.typeKey != null
      ? (types.find((t) => t.key === initial.typeKey)?.id ?? '')
      : (prefill?.activityTypeId ?? typeOptions[0]?.value ?? '');

  const [participant, setParticipant] = useState<ParticipantValue>({
    isShared: initial?.isShared ?? prefill?.isShared ?? false,
    partnerUserId:
      initial?.isShared || prefill?.isShared ? (partner?.userId ?? undefined) : undefined,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      activity_type_id: initialTypeId,
      occurred_on: initial?.occurredOn ?? todayInZone(),
      duration_min: initial?.durationMin ?? prefill?.durationMin ?? 30,
      intensity: initial?.intensity ?? prefill?.intensity ?? undefined,
      started_at_time: initial?.startedAtTime?.slice(0, 5) ?? '',
      location: initial?.location ?? undefined,
      note: initial?.note ?? undefined,
      custom_label: initial?.customLabel ?? undefined,
      is_shared: false,
      partner_user_id: undefined,
    },
  });

  const watchedTypeId = watch('activity_type_id');
  const watchedDate = watch('occurred_on');
  const intensity = watch('intensity') ?? '';

  const duplicate = useMemo(() => {
    const typeKey = types.find((t) => t.id === watchedTypeId)?.key;
    if (!typeKey || !watchedDate) return null;
    return findDuplicateHint(existingEntries, {
      area: 'movement',
      occurredOn: watchedDate,
      userId: currentUserId,
      typeKey,
      ignoreId: initial?.id,
    });
  }, [types, watchedTypeId, watchedDate, existingEntries, currentUserId, initial?.id]);

  const selectedType = types.find((t) => t.id === watchedTypeId);
  const isOther = selectedType?.key === 'other_movement';

  const submit = handleSubmit(
    async (values) => {
      try {
        await saveActivity.mutateAsync({
          id: initial?.id ?? null,
          activityTypeId: values.activity_type_id,
          occurredOn: values.occurred_on,
          durationMin: values.duration_min,
          intensity: values.intensity ?? null,
          startedAtTime: values.started_at_time || null,
          location: values.location ?? null,
          note: values.note ?? null,
          customLabel: values.custom_label ?? null,
          isShared: participant.isShared,
          partnerUserId: participant.isShared ? (participant.partnerUserId ?? null) : null,
        });
        toast.show(isEdit ? 'Bewegung aktualisiert.' : 'Bewegung wurde gespeichert.', 'success');
        if (keepOpen.current && !isEdit) {
          reset({
            activity_type_id: values.activity_type_id,
            occurred_on: todayInZone(),
            duration_min: 30,
            intensity: undefined,
            started_at_time: '',
            location: undefined,
            note: undefined,
            custom_label: undefined,
            is_shared: false,
            partner_user_id: undefined,
          });
          setParticipant({ isShared: false, partnerUserId: undefined });
          setFocus('activity_type_id');
        } else {
          onSaved();
        }
      } catch {
        toast.show(
          'Der Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.',
          'attention',
        );
      }
    },
    () => setFocus('activity_type_id'),
  );

  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <FormField label="Aktivitätstyp" error={errors.activity_type_id?.message} required>
        <Select options={typeOptions} {...register('activity_type_id')} />
      </FormField>

      {isOther ? (
        <FormField label="Eigene Bezeichnung (optional)" error={errors.custom_label?.message}>
          <Input maxLength={80} placeholder="z. B. Klettern" {...register('custom_label')} />
        </FormField>
      ) : null}

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Datum" error={errors.occurred_on?.message} required>
          <Input type="date" max={todayInZone()} {...register('occurred_on')} />
        </FormField>
        <FormField label="Dauer (Minuten)" error={errors.duration_min?.message} required>
          <Input
            type="number"
            inputMode="numeric"
            min={5}
            max={300}
            {...register('duration_min', { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <RadioGroup
        legend="Intensität (optional)"
        value={intensity}
        options={INTENSITY_OPTIONS}
        onValueChange={(value) =>
          setValue(
            'intensity',
            value === '' ? undefined : (value as 'light' | 'medium' | 'intense'),
            {
              shouldDirty: true,
            },
          )
        }
      />

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Uhrzeit (optional)" error={errors.started_at_time?.message}>
          <Input type="time" {...register('started_at_time')} />
        </FormField>
        <FormField label="Ort / Anbieter (optional)" error={errors.location?.message}>
          <Input maxLength={120} placeholder="z. B. Peloton" {...register('location')} />
        </FormField>
      </div>

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
          Für diesen Tag ist bereits eine ähnliche Bewegung erfasst. Du kannst den Eintrag trotzdem
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
