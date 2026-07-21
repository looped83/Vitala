import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { Textarea } from '@/ui/Form/Textarea';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { Chip } from '@/ui/Chip/Chip';
import { Button } from '@/ui/Button/Button';
import { useToast } from '@/ui/Toast/ToastProvider';
import { todayInZone } from '@/lib/dates/day';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import { LIFE_AREAS, LIFE_AREA_LABEL } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import { ritualFormSchema } from '@/domain/rituals/schemas';
import type { RitualFormValues } from '@/domain/rituals/schemas';
import {
  RITUAL_RECURRENCE_LABEL,
  RITUAL_TIME_LABEL,
  RITUAL_TYPE_LABEL,
  WEEKDAY_SHORT,
} from '@/domain/rituals/types';
import type { Ritual } from '@/domain/rituals/types';
import { useSaveRitual } from './queries';

/** Weekday chips shown Monday-first (ISO index 0=Sun stored underneath). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface RitualFormMember {
  userId: string;
  displayName: string;
}

export interface RitualFormProps {
  ritual?: Ritual | null;
  members: RitualFormMember[];
  currentUserId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function RitualForm({
  ritual,
  members,
  currentUserId,
  onSaved,
  onCancel,
}: RitualFormProps): React.JSX.Element {
  const toast = useToast();
  const save = useSaveRitual();
  const today = todayInZone();

  const initialOwnerType = ritual?.ownerType ?? 'personal';
  const defaults: RitualFormValues = {
    owner_type: initialOwnerType,
    owner_user_id:
      initialOwnerType === 'shared' ? undefined : (ritual?.ownerUserId ?? currentUserId),
    title: ritual?.title ?? '',
    description: ritual?.description ?? undefined,
    life_area: ritual?.lifeArea ?? undefined,
    ritual_type: ritual?.ritualType ?? 'check',
    recurrence: ritual?.recurrence ?? 'daily',
    preferred_time: ritual?.preferredTime ?? 'flexible',
    weekdays: ritual?.weekdays ?? [],
    start_date: ritual?.startDate ?? today,
    end_date: ritual?.endDate ?? undefined,
    sort_order: ritual?.sortOrder ?? 100,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RitualFormValues>({
    resolver: zodResolver(ritualFormSchema),
    defaultValues: defaults,
  });

  const ownerType = watch('owner_type');
  const recurrence = watch('recurrence');
  const weekdays = watch('weekdays') ?? [];

  function toggleDay(day: number): void {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day];
    setValue('weekdays', next, { shouldValidate: true });
  }

  const submit = handleSubmit((values) => {
    save.mutate(
      {
        id: ritual?.id ?? null,
        ownerType: values.owner_type,
        ownerUserId: values.owner_type === 'personal' ? values.owner_user_id : null,
        title: values.title,
        description: values.description ?? null,
        lifeArea: (values.life_area as LifeArea | undefined) ?? null,
        ritualType: values.ritual_type,
        recurrence: values.recurrence,
        preferredTime: values.preferred_time,
        weekdays: values.weekdays,
        startDate: values.start_date,
        endDate: values.end_date ?? null,
        sortOrder: values.sort_order,
      },
      {
        onSuccess: () => {
          toast.show(ritual ? 'Ritual aktualisiert.' : 'Ritual wurde angelegt.', 'success');
          onSaved();
        },
        onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
      },
    );
  });

  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <RadioGroup
        legend="Wem gehört das Ritual?"
        value={ownerType}
        options={[
          { value: 'personal', label: 'Persönlich' },
          { value: 'shared', label: 'Gemeinsam' },
        ]}
        onValueChange={(v) => {
          setValue('owner_type', v, { shouldValidate: true });
          if (v === 'shared') setValue('owner_user_id', undefined);
          else setValue('owner_user_id', currentUserId);
        }}
      />

      {ownerType === 'personal' ? (
        <FormField label="Für wen?" error={errors.owner_user_id?.message}>
          <Select
            options={members.map((m) => ({ value: m.userId, label: m.displayName }))}
            {...register('owner_user_id')}
          />
        </FormField>
      ) : null}

      <FormField label="Titel" error={errors.title?.message} required>
        <Input maxLength={80} placeholder="z. B. Vogeltränke prüfen" {...register('title')} />
      </FormField>

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Wiederholung" error={errors.recurrence?.message} required>
          <Select
            options={(
              Object.keys(RITUAL_RECURRENCE_LABEL) as (keyof typeof RITUAL_RECURRENCE_LABEL)[]
            ).map((r) => ({ value: r, label: RITUAL_RECURRENCE_LABEL[r] }))}
            {...register('recurrence')}
          />
        </FormField>
        <FormField label="Tageszeit" error={errors.preferred_time?.message} required>
          <Select
            options={(Object.keys(RITUAL_TIME_LABEL) as (keyof typeof RITUAL_TIME_LABEL)[]).map(
              (t) => ({
                value: t,
                label: RITUAL_TIME_LABEL[t],
              }),
            )}
            {...register('preferred_time')}
          />
        </FormField>
      </div>

      {recurrence === 'weekly' ? (
        <FormField label="Wochentage" error={errors.weekdays?.message} required>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            {WEEKDAY_ORDER.map((d) => (
              <Chip key={d} pressed={weekdays.includes(d)} onClick={() => toggleDay(d)}>
                {WEEKDAY_SHORT[d]}
              </Chip>
            ))}
          </div>
        </FormField>
      ) : null}

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Art" error={errors.ritual_type?.message}>
          <Select
            options={(Object.keys(RITUAL_TYPE_LABEL) as (keyof typeof RITUAL_TYPE_LABEL)[]).map(
              (t) => ({
                value: t,
                label: RITUAL_TYPE_LABEL[t],
              }),
            )}
            {...register('ritual_type')}
          />
        </FormField>
        <FormField label="Bereich (optional)" error={errors.life_area?.message}>
          <Select
            options={[
              { value: '', label: 'Kein Bereich' },
              ...LIFE_AREAS.map((a) => ({ value: a, label: LIFE_AREA_LABEL[a] })),
            ]}
            {...register('life_area')}
          />
        </FormField>
      </div>

      <FormField label="Beschreibung (optional)" error={errors.description?.message}>
        <Textarea maxLength={300} rows={2} {...register('description')} />
      </FormField>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-8)',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <Button variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" loading={save.isPending}>
          {ritual ? 'Speichern' : 'Ritual anlegen'}
        </Button>
      </div>
    </form>
  );
}
