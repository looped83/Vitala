import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';
import { Button } from '@/ui/Button/Button';

describe('Dialog', () => {
  it('renders with an accessible name and moves focus inside', async () => {
    render(
      <Dialog open onClose={() => {}} title="Bestätigen">
        <Button>Aktion</Button>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Bestätigen' });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it('closes on Escape when dismissable', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Bestätigen">
        <Button>Aktion</Button>
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Versteckt">
        <p>Inhalt</p>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
