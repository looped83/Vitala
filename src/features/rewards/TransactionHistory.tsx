import { formatInTimeZone } from 'date-fns-tz';
import { de } from 'date-fns/locale';
import { Spinner } from '@/ui/Spinner/Spinner';
import { xpReasonLabel, resourceReasonLabel, RESOURCE_META } from '@/domain/rewards/display';
import { useResourceHistory, useXpHistory } from './queries';
import styles from './rewards.module.css';

export interface TransactionHistoryProps {
  householdId: string | undefined;
  kind: 'xp' | 'resources';
}

function fmtDate(iso: string): string {
  return formatInTimeZone(`${iso}T12:00:00Z`, 'UTC', 'd. MMM yyyy', { locale: de });
}

/**
 * Nachvollziehbare Belohnungshistorie (§55). Each row states date, source and a
 * signed amount; corrections are labelled as such, never hidden. Technical
 * metadata (dedup keys, rule internals) is never shown. Paginated to 50 rows so
 * payloads stay small (performance §63).
 */
export function TransactionHistory({
  householdId,
  kind,
}: TransactionHistoryProps): React.JSX.Element {
  const xp = useXpHistory(kind === 'xp' ? householdId : undefined);
  const res = useResourceHistory(kind === 'resources' ? householdId : undefined);

  if (kind === 'xp') {
    if (xp.isLoading) return <Spinner label="Verlauf wird geladen" />;
    const rows = xp.data ?? [];
    if (rows.length === 0) return <p className={styles.txMeta}>Noch keine XP-Transaktionen.</p>;
    return (
      <ul className={styles.txList}>
        {rows.map((t) => (
          <li key={t.id} className={styles.txRow}>
            <span>
              <span className={styles.txReason}>{xpReasonLabel(t.reason)}</span>
              <br />
              <span className={styles.txMeta}>
                {t.scope === 'city' ? 'Stadt-XP' : 'Persönlich'} · {fmtDate(t.businessDate)}
              </span>
            </span>
            <span className={styles.txAmount} data-negative={t.amount < 0}>
              {t.amount > 0 ? `+${t.amount}` : t.amount} XP
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (res.isLoading) return <Spinner label="Verlauf wird geladen" />;
  const rows = res.data ?? [];
  if (rows.length === 0)
    return <p className={styles.txMeta}>Noch keine Ressourcen-Transaktionen.</p>;
  return (
    <ul className={styles.txList}>
      {rows.map((t) => (
        <li key={t.id} className={styles.txRow}>
          <span>
            <span className={styles.txReason}>
              {RESOURCE_META[t.resourceKey].symbol} {RESOURCE_META[t.resourceKey].label}
            </span>
            <br />
            <span className={styles.txMeta}>
              {resourceReasonLabel(t.reason)} · {fmtDate(t.businessDate)}
            </span>
          </span>
          <span className={styles.txAmount} data-negative={t.amount < 0}>
            {t.amount > 0 ? `+${t.amount}` : t.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}
