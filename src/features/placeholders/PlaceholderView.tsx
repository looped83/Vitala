import type { ReactNode } from 'react';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { Badge } from '@/ui/Badge/Badge';
import { Icon } from '@/ui/Icon/Icon';
import type { IconName } from '@/ui/Icon/Icon';

export interface PlaceholderViewProps {
  icon: IconName;
  title: string;
  /** What this area will do — honest, no fabricated data (spec §37/§38). */
  description: ReactNode;
  /** Which later phase brings the functionality. */
  phaseNote: string;
}

/**
 * Honest placeholder for a main area whose functionality arrives in a later
 * phase. Clearly labelled "in Vorbereitung" — never shows fake KPIs, fake
 * activities, or invented progress (spec §38, no fake data).
 */
export function PlaceholderView({
  icon,
  title,
  description,
  phaseNote,
}: PlaceholderViewProps): React.JSX.Element {
  return (
    <EmptyState
      icon={<Icon name={icon} size={32} />}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {title}
          <Badge tone="neutral">In Vorbereitung</Badge>
        </span>
      }
      description={
        <>
          {description}
          <br />
          <span style={{ display: 'inline-block', marginTop: 8 }}>{phaseNote}</span>
        </>
      }
    />
  );
}
