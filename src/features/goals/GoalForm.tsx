import { useMemo, useState } from 'react';
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
import { goalFormSchema } from '@/domain/goals/schemas';
import type { GoalFormValues } from '@/domain/goals/schemas';
import {
  MEASUREMENT_LABEL,
  UNIT_LABEL,
  type Goal,
  type GoalMeasurement,
  type GoalTemplate,
  type GoalUnit,
} from '@/domain/goals/types';
import type { ActivityType, RitualDefinition } from '@/domain/activity/types';
import { useSaveGoal } from './queries';

/** Units compatible with a measurement (mirrors the DB constraint). */
const UNITS_FOR: Record<GoalMeasurement, GoalUnit[]> = {
  entry_count: ['units', 'meals', 'actions'],
  duration_minutes: ['minutes'],
  active_days: ['days'],
  shared_count: ['shared_activities', 'units'],
  distinct_types: ['units', 'actions'],
  manual: ['units', 'actions', 'days', 'meals'],
  boolean: ['actions', 'units'],
};

interface Cadence {
  id: string;
  label: string;
  period: GoalFormValues['period_type'];
  recurrence: GoalFormValues['recurrence'];
}

const CADENCES: Cadence[] = [
  { id: 'weekly', label: 'Jede Woche', period: 'week', recurrence: 'weekly' },
  { id: 'monthly', label: 'Jeden Monat', period: 'month', recurrence: 'monthly' },
  { id: 'quarterly', label: 'Jedes Quartal', period: 'quarter', recurrence: 'quarterly' },
  { id: 'daily', label: 'Jeden Tag', period: 'day', recurrence: 'daily' },
  { id: 'once_week', label: 'Einmalig – eine Woche', period: 'week', recurrence: 'none' },
  { id: 'once_month', label: 'Einmalig – ein Monat', period: 'month', recurrence: 'none' },
  { id: 'custom', label: 'Eigener Zeitraum', period: 'custom', recurrence: 'none' },
];

function cadenceIdOf(period: string, recurrence: string): string {
  const found = CADENCES.find((c) => c.period === period && c.recurrence === recurrence);
  return found?.id ?? 'weekly';
}

export interface GoalFormMember {
  userId: string;
  displayName: string;
}

export interface GoalFormProps {
  goal?: Goal | null;
  template?: GoalTemplate | null;
  members: GoalFormMember[];
  currentUserId: string;
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] };
  onSaved: () => void;
  onCancel: () => void;
}

export function GoalForm({
  goal,
  template,
  members,
  currentUserId,
  catalog,
  onSaved,
  onCancel,
}: GoalFormProps): React.JSX.Element {
  const toast = useToast();
  const save = useSaveGoal();
  const today = todayInZone();

  const initialOwnerType = goal?.ownerType ?? template?.ownerType ?? 'personal';
  const defaults: GoalFormValues = {
    owner_type: initialOwnerType,
    owner_user_id: initialOwnerType === 'shared' ? undefined : (goal?.ownerUserId ?? currentUserId),
    title: goal?.title ?? template?.title ?? '',
    description: goal?.description ?? template?.description ?? undefined,
    life_area: goal?.lifeArea ?? template?.lifeArea ?? 'movement',
    measurement: goal?.measurement ?? template?.measurement ?? 'entry_count',
    target_value: goal?.targetValue ?? template?.targetValue ?? 3,
    unit: goal?.unit ?? template?.unit ?? 'units',
    period_type: goal?.periodType ?? template?.periodType ?? 'week',
    recurrence: goal?.recurrence ?? template?.recurrence ?? 'weekly',
    activity_type_keys: goal?.activityTypeKeys ?? template?.activityTypeKeys ?? [],
    ritual_definition_keys: goal?.ritualDefinitionKeys ?? template?.ritualDefinitionKeys ?? [],
    start_date: goal?.startDate ?? today,
    end_date: goal?.endDate ?? undefined,
    template_key: goal?.templateKey ?? template?.key,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: defaults,
  });

  const ownerType = watch('owner_type');
  const measurement = watch('measurement');
  const lifeArea = watch('life_area') as LifeArea;
  const periodType = watch('period_type');
  const recurrence = watch('recurrence');
  const activityKeys = watch('activity_type_keys') ?? [];
  const ritualKeys = watch('ritual_definition_keys') ?? [];
  const [cadenceId, setCadenceId] = useState(() =>
    cadenceIdOf(defaults.period_type, defaults.recurrence),
  );

  const unitOptions = useMemo(
    () => UNITS_FOR[measurement].map((u) => ({ value: u, label: UNIT_LABEL[u] })),
    [measurement],
  );

  const filterOptions = useMemo(() => {
    if (lifeArea === 'movement') {
      return catalog.types.map((t) => ({ key: t.key, name: t.name }));
    }
    return catalog.definitions
      .filter((d) => d.area === lifeArea)
      .map((d) => ({ key: d.key, name: d.name }));
  }, [lifeArea, catalog]);

  function onMeasurementChange(next: GoalMeasurement): void {
    setValue('measurement', next, { shouldValidate: true });
    const units = UNITS_FOR[next];
    if (!units.includes(watch('unit'))) {
      setValue('unit', units[0] as GoalUnit, { shouldValidate: true });
    }
    if (next === 'boolean') setValue('target_value', 1, { shouldValidate: true });
    if (next === 'duration_minutes') setValue('life_area', 'movement', { shouldValidate: true });
  }

  function onAreaChange(next: LifeArea): void {
    setValue('life_area', next, { shouldValidate: true });
    // Reset now-incompatible filters.
    setValue('activity_type_keys', [], { shouldValidate: true });
    setValue('ritual_definition_keys', [], { shouldValidate: true });
  }

  function onCadenceChange(id: string): void {
    const c = CADENCES.find((x) => x.id === id) ?? CADENCES[0];
    if (!c) return;
    setCadenceId(id);
    setValue('period_type', c.period, { shouldValidate: true });
    setValue('recurrence', c.recurrence, { shouldValidate: true });
  }

  function toggleFilter(key: string): void {
    const field = lifeArea === 'movement' ? 'activity_type_keys' : 'ritual_definition_keys';
    const current = lifeArea === 'movement' ? activityKeys : ritualKeys;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setValue(field, next, { shouldValidate: true });
  }

  const submit = handleSubmit((values) => {
    save.mutate(
      {
        id: goal?.id ?? null,
        ownerType: values.owner_type,
        ownerUserId: values.owner_type === 'personal' ? values.owner_user_id : null,
        title: values.title,
        description: values.description ?? null,
        lifeArea: values.life_area as LifeArea,
        measurement: values.measurement,
        targetValue: values.target_value,
        unit: values.unit,
        periodType: values.period_type,
        recurrence: values.recurrence,
        activityTypeKeys: values.activity_type_keys,
        ritualDefinitionKeys: values.ritual_definition_keys,
        startDate: values.start_date,
        endDate: values.end_date ?? null,
        templateKey: values.template_key ?? null,
      },
      {
        onSuccess: () => {
          toast.show(goal ? 'Ziel aktualisiert.' : 'Ziel wurde angelegt.', 'success');
          onSaved();
        },
        onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
      },
    );
  });

  const selectedFilters = lifeArea === 'movement' ? activityKeys : ritualKeys;

  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <RadioGroup
        legend="Wem gehört das Ziel?"
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
        <Input
          maxLength={80}
          placeholder="z. B. Dreimal Bewegung pro Woche"
          {...register('title')}
        />
      </FormField>

      <FormField label="Lebensbereich" error={errors.life_area?.message} required>
        <Select
          options={LIFE_AREAS.map((a) => ({ value: a, label: LIFE_AREA_LABEL[a] }))}
          value={lifeArea}
          onChange={(e) => onAreaChange(e.target.value as LifeArea)}
        />
      </FormField>

      <FormField label="Messmethode" error={errors.measurement?.message} required>
        <Select
          options={(Object.keys(MEASUREMENT_LABEL) as GoalMeasurement[]).map((m) => ({
            value: m,
            label: MEASUREMENT_LABEL[m],
          }))}
          value={measurement}
          onChange={(e) => onMeasurementChange(e.target.value as GoalMeasurement)}
        />
      </FormField>

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Zielwert" error={errors.target_value?.message} required>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            disabled={measurement === 'boolean'}
            {...register('target_value', { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Einheit" error={errors.unit?.message} required>
          <Select options={unitOptions} {...register('unit')} />
        </FormField>
      </div>

      <FormField label="Zeitraum & Wiederholung" error={errors.recurrence?.message} required>
        <Select
          options={CADENCES.map((c) => ({ value: c.id, label: c.label }))}
          value={cadenceId}
          onChange={(e) => onCadenceChange(e.target.value)}
        />
      </FormField>

      <div style={{ display: 'grid', gap: 'var(--space-16)', gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="Startdatum" error={errors.start_date?.message} required>
          <Input type="date" {...register('start_date')} />
        </FormField>
        {periodType === 'custom' ? (
          <FormField label="Enddatum" error={errors.end_date?.message} required>
            <Input type="date" min={watch('start_date')} {...register('end_date')} />
          </FormField>
        ) : null}
      </div>

      {filterOptions.length > 0 && measurement !== 'manual' && measurement !== 'boolean' ? (
        <FormField
          label="Nur bestimmte Arten zählen (optional)"
          description="Ohne Auswahl zählen alle Einträge des Bereichs."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
            {filterOptions.map((o) => (
              <Chip
                key={o.key}
                type="button"
                pressed={selectedFilters.includes(o.key)}
                onClick={() => toggleFilter(o.key)}
              >
                {o.name}
              </Chip>
            ))}
          </div>
        </FormField>
      ) : null}

      <FormField label="Beschreibung (optional)" error={errors.description?.message}>
        <Textarea maxLength={500} rows={2} {...register('description')} />
      </FormField>

      <p
        style={{
          margin: 0,
          fontSize: 'var(--font-size-small)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {recurrence === 'none' ? 'Einmaliges Ziel.' : 'Startet automatisch in jeder neuen Periode.'}{' '}
        Es gibt keine Strafe – du kannst jederzeit pausieren oder anpassen.
      </p>

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
          {goal ? 'Speichern' : 'Ziel anlegen'}
        </Button>
      </div>
    </form>
  );
}
