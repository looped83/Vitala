import { cn } from '@/ui/cn';
import styles from './Divider.module.css';

/** Visual separator. Decorative by default (role="presentation"). */
export function Divider({ className }: { className?: string }): React.JSX.Element {
  return <hr className={cn(styles.divider, className)} />;
}
