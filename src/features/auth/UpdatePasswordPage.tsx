import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { passwordUpdateSchema } from '@/domain/auth/schemas';
import type { PasswordUpdateInput } from '@/domain/auth/schemas';
import { updatePassword } from '@/data/repositories/auth';
import { isAppError } from '@/lib/errors/app-error';
import { paths } from '@/app/router/routes';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

/**
 * Set a new password. Reached from the reset email (Supabase establishes a
 * recovery session via detectSessionInUrl). If there is no session, the user is
 * asked to restart the reset flow.
 */
export function UpdatePasswordPage(): React.JSX.Element {
  useDocumentTitle('Neues Passwort');
  const navigate = useNavigate();
  const { status } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updatePassword(values.password);
      setDone(true);
      window.setTimeout(() => navigate(paths.today, { replace: true }), 1200);
    } catch (error) {
      setFormError(
        isAppError(error) ? error.message : 'Das Passwort konnte nicht geändert werden.',
      );
    }
  });

  return (
    <AuthLayout title="Neues Passwort festlegen">
      {status !== 'authenticated' ? (
        <Alert tone="warning" role="status">
          Dieser Link ist ungültig oder abgelaufen. Bitte fordere über die Seite zum Zurücksetzen
          des Passworts einen neuen an.
        </Alert>
      ) : done ? (
        <Alert tone="success" role="status">
          Dein Passwort wurde geändert. Du wirst weitergeleitet …
        </Alert>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          noValidate
          style={{ display: 'grid', gap: 'var(--space-16)' }}
        >
          {formError ? (
            <Alert tone="attention" role="alert">
              {formError}
            </Alert>
          ) : null}
          <FormField
            label="Neues Passwort"
            description="Mindestens 8 Zeichen."
            error={errors.password?.message}
            required
          >
            <Input type="password" autoComplete="new-password" {...register('password')} />
          </FormField>
          <FormField label="Passwort bestätigen" error={errors.confirm?.message} required>
            <Input type="password" autoComplete="new-password" {...register('confirm')} />
          </FormField>
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Passwort speichern
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
