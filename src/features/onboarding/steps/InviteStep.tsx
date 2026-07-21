import { Button } from '@/ui/Button/Button';
import { Divider } from '@/ui/Divider/Divider';
import { InvitePanel } from '@/features/household/InvitePanel';

/**
 * Optional step 3: the owner invites the second member now, or continues and
 * does it later from Settings. Never a dead end (spec §12).
 */
export function InviteStep({ onFinish }: { onFinish: () => void }): React.JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-24)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Lade jetzt die zweite Person ein – oder mach das später in den Einstellungen.
      </p>
      <InvitePanel isFull={false} />
      <Divider />
      <Button variant="secondary" size="lg" fullWidth onClick={onFinish}>
        Weiter zu Vitala
      </Button>
    </div>
  );
}
