import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './Section.module.css';

export interface SectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** Heading level for correct document outline (accessibility §19.1). */
  headingLevel?: 2 | 3;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A labelled content section with a heading and optional description. */
export function Section({
  title,
  description,
  headingLevel = 2,
  action,
  className,
  children,
}: SectionProps): React.JSX.Element {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className={cn(styles.section, className)}>
      <div className={styles.head}>
        <div>
          <Heading className={styles.title}>{title}</Heading>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
