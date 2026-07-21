import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { Link } from '@/ui/Link/Link';
import { loginSchema } from '@/domain/auth/schemas';
import type { LoginInput } from '@/domain/auth/schemas';
import { signInWithPassword } from '@/data/repositories/auth';
import { isAppError } from '@/lib/errors/app-error';
import { DEFAULT_REDIRECT, sanitizeRedirect } from '@/lib/navigation/redirect';
import { paths } from '@/app/router/routes';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

/**
 * Login page. Private product → no public registration link (spec §37.1). On
 * success we navigate to the sanitized `redirect` target (open-redirect safe).
 */
export function LoginPage(): React.JSX.Element {
  useDocumentTitle('Anmelden');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signInWithPassword(values);
      const redirect = sanitizeRedirect(params.get('redirect'), DEFAULT_REDIRECT);
      navigate(redirect, { replace: true });
    } catch (error) {
      setFormError(isAppError(error) ? error.message : 'Anmeldung nicht möglich.');
      setFocus('email');
    }
  });

  return (
    <AuthLayout
      title="Willkommen zurück"
      subtitle="Melde dich an, um mit Vitala fortzufahren."
      footer={
        <Link to={paths.resetPassword} variant="quiet">
          Passwort vergessen?
        </Link>
      }
    >
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

        <FormField label="Passwort" error={errors.password?.message} required>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </FormField>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Anmelden
        </Button>
      </form>
    </AuthLayout>
  );
}
