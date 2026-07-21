import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { render } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Alert } from '@/ui/Alert/Alert';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { LoginPage } from '@/features/auth/LoginPage';

expect.extend(axeMatchers);

vi.mock('@/data/repositories/auth', () => ({
  signInWithPassword: vi.fn(),
}));

describe('accessibility (axe)', () => {
  it('a labelled form field has no violations', async () => {
    const { container } = render(
      <FormField label="E-Mail" description="Deine Adresse" required>
        <Input type="email" />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('an alert has no violations', async () => {
    const { container } = render(<Alert tone="attention">Ein Hinweis</Alert>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('an empty state has no violations', async () => {
    const { container } = render(
      <EmptyState title="Nichts hier" description="Alles in Ordnung." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the login page has no violations', async () => {
    const { container } = renderWithProviders(<LoginPage />, { route: '/login' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
