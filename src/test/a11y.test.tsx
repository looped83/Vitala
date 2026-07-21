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
import { ProgressBar } from '@/features/goals/ProgressBar';
import { BalanceBars } from '@/features/review/BalanceBars';
import { emptyAreaTotals } from '@/domain/review/aggregate';

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

  it('a goal progress bar exposes an accessible name and value', async () => {
    const { container, getByRole } = render(
      <ProgressBar value={2} target={3} label="Dreimal Bewegung" area="movement" />,
    );
    const bar = getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveAttribute('aria-label', 'Dreimal Bewegung');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the review balance display has no violations and renders text values', async () => {
    const totals = emptyAreaTotals();
    totals.byArea.movement = 3;
    totals.byArea.nutrition = 1;
    const { container } = render(<BalanceBars totals={totals} />);
    expect(container.textContent).toContain('Bewegung');
    expect(container.textContent).toContain('3 Einträge');
    expect(await axe(container)).toHaveNoViolations();
  });
});
