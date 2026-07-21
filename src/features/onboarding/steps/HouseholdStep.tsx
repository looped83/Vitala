import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { useCreateHousehold, useAcceptInvite } from '@/features/household/queries';
import { createHouseholdSchema, acceptInviteSchema } from '@/domain/household/schemas';
import type { CreateHouseholdInput, AcceptInviteInput } from '@/domain/household/schemas';
import { isAppError } from '@/lib/errors/app-error';

type Mode = 'create' | 'join';

/** Step 2: create a new household or join via an invite code (user-flows §14.2/§14.3). */
export function HouseholdStep(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div style={{ display: 'grid', gap: 'var(--space-24)' }}>
      <RadioGroup<Mode>
        legend="Wie möchtest du starten?"
        value={mode}
        onValueChange={setMode}
        orientation="stack"
        options={[
          {
            value: 'create',
            label: 'Neuen Household erstellen',
            description: 'Du richtest euren gemeinsamen Household ein.',
          },
          {
            value: 'join',
            label: 'Einer Einladung folgen',
            description: 'Du hast einen Einladungscode erhalten.',
          },
        ]}
      />
      {mode === 'create' ? <CreateForm /> : <JoinForm />}
    </div>
  );
}

function CreateForm(): React.JSX.Element {
  const createHousehold = useCreateHousehold();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateHouseholdInput>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: { name: 'Vitala von Lutz & René' },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      await createHousehold.mutateAsync(values.name);
    },
    () => setFocus('name'),
  );

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <FormField
        label="Name eures Households"
        description="Ein freundlicher Name, den ihr beide seht."
        error={errors.name?.message}
        required
      >
        <Input {...register('name')} />
      </FormField>
      {createHousehold.isError ? (
        <Alert tone="attention" role="alert">
          {isAppError(createHousehold.error)
            ? createHousehold.error.message
            : 'Der Household konnte nicht erstellt werden.'}
        </Alert>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Household erstellen
      </Button>
    </form>
  );
}

function JoinForm(): React.JSX.Element {
  const acceptInvite = useAcceptInvite();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      await acceptInvite.mutateAsync(values.code);
    },
    () => setFocus('code'),
  );

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <FormField
        label="Einladungscode"
        description="Zehn Zeichen aus 0–9 und A–F."
        error={errors.code?.message}
        required
      >
        <Input
          autoComplete="one-time-code"
          style={{ letterSpacing: '0.1em' }}
          {...register('code')}
        />
      </FormField>
      {acceptInvite.isError ? (
        <Alert tone="attention" role="alert">
          {isAppError(acceptInvite.error)
            ? acceptInvite.error.message
            : 'Der Beitritt hat nicht geklappt.'}
        </Alert>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Beitreten
      </Button>
    </form>
  );
}
