import { useState } from 'react';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { Icon } from '@/ui/Icon/Icon';
import { formatDateInZone } from '@/lib/dates/format';
import { useCreateInvite } from './queries';
import { isAppError } from '@/lib/errors/app-error';
import styles from './InvitePanel.module.css';

/**
 * Owner-only panel to generate a one-time invite code for the second member.
 * The plaintext code is shown once (only its hash is stored server-side).
 */
export function InvitePanel({ isFull }: { isFull: boolean }): React.JSX.Element {
  const createInvite = useCreateInvite();
  const [copied, setCopied] = useState(false);
  const invite = createInvite.data;

  const handleCopy = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (isFull) {
    return (
      <Alert tone="info" role="status">
        Euer Household ist vollständig – zwei Personen sind aktiv.
      </Alert>
    );
  }

  return (
    <div className={styles.panel}>
      <p className={styles.hint}>
        Erzeuge einen Einladungscode und teile ihn mit der zweiten Person. Der Code ist sieben Tage
        gültig und kann einmal eingelöst werden.
      </p>

      {invite ? (
        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>Einladungscode</p>
          <div className={styles.codeRow}>
            <code className={styles.code}>{invite.code}</code>
            <Button
              variant="secondary"
              leadingIcon={<Icon name="check" size={18} />}
              onClick={() => void handleCopy(invite.code)}
            >
              {copied ? 'Kopiert' : 'Kopieren'}
            </Button>
          </div>
          <p className={styles.expiry}>
            Gültig bis {formatDateInZone(invite.expiresAt, 'Europe/Berlin', 'PPpp')}
          </p>
        </div>
      ) : null}

      {createInvite.isError ? (
        <Alert tone="attention" role="alert">
          {isAppError(createInvite.error)
            ? createInvite.error.message
            : 'Der Code konnte nicht erzeugt werden.'}
        </Alert>
      ) : null}

      <Button
        onClick={() => createInvite.mutate()}
        loading={createInvite.isPending}
        variant={invite ? 'secondary' : 'primary'}
      >
        {invite ? 'Neuen Code erzeugen' : 'Einladungscode erzeugen'}
      </Button>
    </div>
  );
}
