import { useEffect, useState } from 'react';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { FormField } from '@/ui/Form/FormField';
import { Textarea } from '@/ui/Form/Textarea';
import { useToast } from '@/ui/Toast/ToastProvider';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import { todayInZone } from '@/lib/dates/day';
import {
  CHECKIN_TEXT_MAX,
  DAY_FEELING_LABEL,
  DAY_FEELING_STEPS,
  DAY_FOCUS_LABEL,
  DAY_FOCUS_STEPS,
  DAY_INTENSITY_LABEL,
  DAY_INTENSITY_STEPS,
  ENERGY_LABEL,
  ENERGY_STEPS,
  TIME_BUDGET_LABEL,
  TIME_BUDGET_STEPS,
} from '@/domain/checkins/types';
import type {
  CheckIn,
  CheckInType,
  DayFocus,
  DayIntensity,
  TimeBudget,
} from '@/domain/checkins/types';
import { useCheckIn, useSaveCheckIn } from './queries';

export interface CheckInDialogProps {
  type: CheckInType;
  open: boolean;
  onClose: () => void;
}

const EMPTY = '';

/**
 * Morning / evening check-in (spec §21–§24). All fields optional (a one-tap
 * save is valid). Neutral, non-medical scales; free text is private and never
 * analysed. Editable on the same day; one per user, type and local day.
 */
export function CheckInDialog({ type, open, onClose }: CheckInDialogProps): React.JSX.Element {
  const today = todayInZone();
  const existing = useCheckIn(type, today);
  const save = useSaveCheckIn();
  const toast = useToast();

  const [energy, setEnergy] = useState<string>(EMPTY);
  const [time, setTime] = useState<string>(EMPTY);
  const [intensity, setIntensity] = useState<string>(EMPTY);
  const [focus, setFocus] = useState<string>(EMPTY);
  const [wish, setWish] = useState('');
  const [feeling, setFeeling] = useState<string>(EMPTY);
  const [moment, setMoment] = useState('');
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionEasier, setReflectionEasier] = useState('');

  // Prefill from an existing check-in when it loads / the dialog opens.
  useEffect(() => {
    if (!open) return;
    const c: CheckIn | null | undefined = existing.data;
    setEnergy(c?.energyLevel ? String(c.energyLevel) : EMPTY);
    setTime(c?.availableTime ?? EMPTY);
    setIntensity(c?.intensity ?? EMPTY);
    setFocus(c?.focus ?? EMPTY);
    setWish(c?.wishText ?? '');
    setFeeling(c?.dayFeeling ? String(c.dayFeeling) : EMPTY);
    setMoment(c?.positiveMoment ?? '');
    setReflectionGood(c?.reflectionGood ?? '');
    setReflectionEasier(c?.reflectionEasier ?? '');
  }, [open, existing.data]);

  function handleSave(): void {
    save.mutate(
      type === 'morning'
        ? {
            type,
            energyLevel: energy ? Number(energy) : null,
            availableTime: (time || null) as TimeBudget | null,
            intensity: (intensity || null) as DayIntensity | null,
            focus: (focus || null) as DayFocus | null,
            wishText: wish || null,
          }
        : {
            type,
            dayFeeling: feeling ? Number(feeling) : null,
            positiveMoment: moment || null,
            reflectionGood: reflectionGood || null,
            reflectionEasier: reflectionEasier || null,
          },
      {
        onSuccess: () => {
          toast.show(
            type === 'morning' ? 'Guten Morgen – gespeichert.' : 'Schönen Abend – gespeichert.',
            'success',
          );
          onClose();
        },
        onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
      },
    );
  }

  const isMorning = type === 'morning';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isMorning ? 'Morgen-Check-in' : 'Abend-Check-in'}
      description={
        isMorning
          ? 'Wie startest du in den Tag? Alles freiwillig – in unter einer Minute.'
          : 'Ein ruhiger Blick zurück. Alles freiwillig.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} loading={save.isPending}>
            Speichern
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-24)' }}>
        {isMorning ? (
          <>
            <RadioGroup
              legend="Energielevel"
              orientation="stack"
              value={energy}
              options={ENERGY_STEPS.map((n) => ({
                value: String(n),
                label: ENERGY_LABEL[n] ?? '',
              }))}
              onValueChange={setEnergy}
            />
            <RadioGroup
              legend="Verfügbare Zeit"
              orientation="stack"
              value={time}
              options={TIME_BUDGET_STEPS.map((t) => ({ value: t, label: TIME_BUDGET_LABEL[t] }))}
              onValueChange={setTime}
            />
            <RadioGroup
              legend="Gewünschte Tagesintensität"
              value={intensity}
              options={DAY_INTENSITY_STEPS.map((i) => ({
                value: i,
                label: DAY_INTENSITY_LABEL[i],
              }))}
              onValueChange={setIntensity}
            />
            <RadioGroup
              legend="Tagesfokus (optional)"
              orientation="stack"
              value={focus}
              options={DAY_FOCUS_STEPS.map((f) => ({ value: f, label: DAY_FOCUS_LABEL[f] }))}
              onValueChange={setFocus}
            />
            <FormField label="Kurzer Tageswunsch (optional)">
              <Textarea
                maxLength={CHECKIN_TEXT_MAX}
                rows={2}
                value={wish}
                onChange={(e) => setWish(e.target.value)}
              />
            </FormField>
          </>
        ) : (
          <>
            <RadioGroup
              legend="Tagesgefühl"
              orientation="stack"
              value={feeling}
              options={DAY_FEELING_STEPS.map((n) => ({
                value: String(n),
                label: DAY_FEELING_LABEL[n] ?? '',
              }))}
              onValueChange={setFeeling}
            />
            <FormField label="Positiver Tagesmoment (optional)">
              <Textarea
                maxLength={CHECKIN_TEXT_MAX}
                rows={2}
                value={moment}
                onChange={(e) => setMoment(e.target.value)}
              />
            </FormField>
            <FormField label="Was hat heute gutgetan? (optional)">
              <Textarea
                maxLength={CHECKIN_TEXT_MAX}
                rows={2}
                value={reflectionGood}
                onChange={(e) => setReflectionGood(e.target.value)}
              />
            </FormField>
            <FormField label="Was möchte ich morgen leichter gestalten? (optional)">
              <Textarea
                maxLength={CHECKIN_TEXT_MAX}
                rows={2}
                value={reflectionEasier}
                onChange={(e) => setReflectionEasier(e.target.value)}
              />
            </FormField>
          </>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Deine Check-in-Angaben sind privat und nur für dich sichtbar.
        </p>
      </div>
    </Dialog>
  );
}
