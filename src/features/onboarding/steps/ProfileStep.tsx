import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { useUpdateProfile } from '@/features/profile/queries';
import { displayNameSchema } from '@/domain/profile/schemas';
import { z } from 'zod';

const stepSchema = z.object({ display_name: displayNameSchema });
type StepInput = z.infer<typeof stepSchema>;

/** Step 1: set the display name (spec §12). */
export function ProfileStep(): React.JSX.Element {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<StepInput>({
    resolver: zodResolver(stepSchema),
    defaultValues: { display_name: '' },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      await updateProfile.mutateAsync({
        display_name: values.display_name,
        accent_color: 'movement',
        avatar_motif: '',
      });
    },
    () => setFocus('display_name'),
  );

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      style={{ display: 'grid', gap: 'var(--space-16)' }}
    >
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Wie sollen wir dich nennen? Du kannst das später jederzeit ändern.
      </p>
      <FormField label="Anzeigename" error={errors.display_name?.message} required>
        <Input autoComplete="nickname" {...register('display_name')} />
      </FormField>
      {updateProfile.isError ? (
        <Alert tone="attention" role="alert">
          Das hat nicht geklappt. Bitte versuche es erneut.
        </Alert>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Weiter
      </Button>
    </form>
  );
}
