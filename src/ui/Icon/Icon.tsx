import type { SVGProps } from 'react';

/**
 * Self-hosted line-icon set (no external icon library — performance/privacy,
 * technical-architecture §15). Icons are decorative by default (`aria-hidden`);
 * pass an `title` for standalone meaning, or rely on the surrounding
 * label/`aria-label`.
 */
export type IconName =
  | 'today'
  | 'city'
  | 'capture'
  | 'goals'
  | 'review'
  | 'profile'
  | 'settings'
  | 'logout'
  | 'menu'
  | 'close'
  | 'check'
  | 'info'
  | 'warning'
  | 'error'
  | 'sun'
  | 'moon'
  | 'system'
  | 'chevronDown'
  | 'arrowLeft'
  | 'accessibility'
  | 'shield'
  | 'people';

const PATHS: Record<IconName, React.ReactNode> = {
  today: (
    <path d="M4 10h16M7 3v3M17 3v3M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
  ),
  city: <path d="M3 21h18M6 21V9l4-3v15M14 21V4l4 3v14M9 12h1M9 15h1M9 18h1M16 12h1M16 15h1" />,
  capture: <path d="M12 5v14M5 12h14" />,
  goals: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  review: (
    <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1ZM8 9h8M8 13h8M8 17h5" />
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.2 7l2.1 1.2M17.7 15.8 19.8 17M4.2 17l2.1-1.2M17.7 8.2 19.8 7" />
    </>
  ),
  logout: <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12h9M16 8l4 4-4 4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4 12l5 5L20 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  warning: <path d="M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01" />,
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
  system: (
    <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM9 20h6M12 16v4" />
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  accessibility: (
    <>
      <circle cx="12" cy="4.5" r="1.6" />
      <path d="M4.5 8.5h15M12 8.5v6M12 14.5 8.5 20M12 14.5 15.5 20" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6.2A3 3 0 0 1 16 12M17 14c2.4.3 4 2.2 4 5" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Accessible title; when set the icon is exposed to assistive tech. */
  title?: string;
  size?: number;
}

export function Icon({ name, title, size = 24, ...rest }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
