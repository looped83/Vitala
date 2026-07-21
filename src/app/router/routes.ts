import type { IconName } from '@/ui/Icon/Icon';

/** Central path constants — imported everywhere instead of string literals. */
export const paths = {
  login: '/login',
  resetPassword: '/reset-password',
  updatePassword: '/auth/update-password',
  onboarding: '/onboarding',
  today: '/today',
  city: '/city',
  capture: '/capture',
  history: '/history',
  goals: '/goals',
  review: '/review',
  profile: '/profile',
  settings: '/settings',
  forbidden: '/forbidden',
} as const;

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** Primary navigation (mobile bottom bar + desktop sidebar), IA §13.1/§13.2. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { to: paths.today, label: 'Heute', icon: 'today' },
  { to: paths.city, label: 'Stadt', icon: 'city' },
  { to: paths.capture, label: 'Erfassen', icon: 'capture' },
  { to: paths.goals, label: 'Ziele', icon: 'goals' },
  { to: paths.review, label: 'Rückblick', icon: 'review' },
] as const;

/** Secondary navigation, reached via the header/profile menu. */
export const SECONDARY_NAV: readonly NavItem[] = [
  { to: paths.profile, label: 'Profil', icon: 'profile' },
  { to: paths.settings, label: 'Einstellungen', icon: 'settings' },
] as const;
