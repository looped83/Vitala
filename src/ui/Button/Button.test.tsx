import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and defaults to type=button', () => {
    render(<Button>Speichern</Button>);
    const button = screen.getByRole('button', { name: 'Speichern' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Los</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Los' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Senden</Button>);
    const button = screen.getByRole('button', { name: 'Senden' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Aus
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Aus' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
