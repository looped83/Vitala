import type { OnboardingStep } from '@/domain/onboarding/state';
import styles from './OnboardingProgress.module.css';

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'profile', label: 'Profil' },
  { id: 'household', label: 'Household' },
  { id: 'invite', label: 'Einladung' },
];

/** Accessible progress indicator for the onboarding wizard. */
export function OnboardingProgress({ step }: { step: OnboardingStep }): React.JSX.Element {
  const currentIndex = step === 'complete' ? STEPS.length : STEPS.findIndex((s) => s.id === step);
  const total = STEPS.length;
  const position = Math.min(currentIndex + 1, total);

  return (
    <ol className={styles.list} aria-label={`Schritt ${position} von ${total}`}>
      {STEPS.map((item, index) => {
        const stateClass =
          index < currentIndex
            ? styles.done
            : index === currentIndex
              ? styles.current
              : styles.upcoming;
        return (
          <li key={item.id} className={styles.item}>
            <span
              className={`${styles.dot} ${stateClass}`}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              {index + 1}
            </span>
            <span className={styles.label}>{item.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
