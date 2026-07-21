import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from './AuthLayout';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { Link } from '@/ui/Link/Link';
import { passwordResetRequestSchema } from '@/domain/auth/schemas';
import type { PasswordResetRequestInput } from '@/domain/auth/schemas';
import { requestPasswordReset } from '@/data/repositories/auth';
import { isAppError } from '@/lib/errors/app-error';
import { paths } from '@/app/router/routes';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

/** Password reset request. Always shows a neutral confirmation (no account enumeration). */
export function ResetPasswordPage(): React.JSX.Element {
  useDocumentTitle('Passwort zurücksetzen');
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const redirectTo = `${window.location.origin}${paths.updatePassword}`;
      await requestPasswordReset(values.email, redirectTo);
      setDone(true);
    } catch (error) {
      // Do not reveal whether the address exists — show the neutral state
      // unless it is a genuinely actionable error (e.g. rate limiting).
      if (isAppError(error) && error.kind === 'rate_limited') {
        setFormError(error.message);
      } else {
        setDone(true);
      }
    }
  });

  return (
    <AuthLayout
      title="Passwort zurücksetzen"
      subtitle="Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst."
      footer={
        <Link to={paths.login} variant="quiet">
          Zurück zur Anmeldung
        </Link>
      }
    >
      {done ? (
        <Alert tone="success" role="status">
          Falls ein Konto zu dieser Adresse existiert, ist eine E-Mail mit weiteren Schritten
          unterwegs.
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
          <FormField label="E-Mail" error={errors.email?.message} required>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          </FormField>
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Link anfordern
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
