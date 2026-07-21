import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { Input } from './Input';

describe('FormField', () => {
  it('associates the label with the control', () => {
    render(
      <FormField label="E-Mail">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('E-Mail');
    expect(input).toBeInTheDocument();
  });

  it('wires description and error via aria-describedby and marks invalid', () => {
    render(
      <FormField label="Passwort" description="Mindestens 8 Zeichen" error="Zu kurz">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Passwort');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.length).toBeGreaterThan(0);
    // The error text is exposed and announced.
    expect(screen.getByRole('alert')).toHaveTextContent('Zu kurz');
  });

  it('marks required fields as aria-required', () => {
    render(
      <FormField label="Name" required>
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-required', 'true');
  });
});
