import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { LoginPage } from './LoginPage';
import { AppError } from '@/lib/errors/app-error';

const signInMock = vi.fn<(input: { email: string; password: string }) => Promise<unknown>>();
vi.mock('@/data/repositories/auth', () => ({
  signInWithPassword: (input: { email: string; password: string }) => signInMock(input),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('renders the login form without a public registration link', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    expect(screen.getByRole('heading', { name: /Willkommen zurück/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-Mail/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Registrieren/i })).not.toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByText(/E-Mail-Adresse ein/)).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('submits valid credentials to the auth repository', async () => {
    signInMock.mockResolvedValue({});
    renderWithProviders(<LoginPage />, { route: '/login' });
    await userEvent.type(screen.getByLabelText(/E-Mail/), 'lutz@vitala.test');
    await userEvent.type(screen.getByLabelText(/Passwort/), 'secret-pw');
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: 'lutz@vitala.test',
        password: 'secret-pw',
      });
    });
  });

  it('shows a friendly error when sign-in fails', async () => {
    signInMock.mockRejectedValue(
      new AppError({ kind: 'auth', message: 'E-Mail oder Passwort ist nicht korrekt.' }),
    );
    renderWithProviders(<LoginPage />, { route: '/login' });
    await userEvent.type(screen.getByLabelText(/E-Mail/), 'lutz@vitala.test');
    await userEvent.type(screen.getByLabelText(/Passwort/), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nicht korrekt/);
  });
});
