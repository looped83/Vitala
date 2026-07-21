import { Switch } from '@/ui/Form/Switch';
import type { HouseholdMemberWithProfile } from '@/data/repositories/household';

export interface ParticipantValue {
  isShared: boolean;
  partnerUserId?: string;
}

export interface ParticipantFieldProps {
  /** The other active household member (if any). */
  partner: HouseholdMemberWithProfile | null;
  value: ParticipantValue;
  onChange: (value: ParticipantValue) => void;
}

/**
 * "Gemeinsam" toggle. With exactly two people, sharing means "with the other
 * member", so the partner is selected automatically (spec §6.4 / §7.4). A
 * shared entry is stored once and attributed to both — never duplicated.
 */
export function ParticipantField({
  partner,
  value,
  onChange,
}: ParticipantFieldProps): React.JSX.Element {
  if (!partner) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-small)' }}>
        Eine gemeinsame Erfassung ist möglich, sobald eine zweite Person zum Household gehört.
      </p>
    );
  }
  return (
    <Switch
      label={`Gemeinsam mit ${partner.displayName || 'der zweiten Person'}`}
      description="Der Eintrag wird einmal gespeichert und euch beiden zugeordnet."
      checked={value.isShared}
      onChange={(event) =>
        onChange({
          isShared: event.target.checked,
          partnerUserId: event.target.checked ? partner.userId : undefined,
        })
      }
    />
  );
}
