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
  | 'people'
  | 'movement'
  | 'nutrition'
  | 'sustainability'
  | 'animalWelfare'
  | 'edit'
  | 'trash'
  | 'star'
  | 'starFilled'
  | 'filter'
  | 'search'
  | 'clock'
  | 'shared';

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
  movement: <path d="M6.5 6.5 3 10l3.5 3.5M17.5 6.5 21 10l-3.5 3.5M6 10h12M10 17l1-3M14 3l-1 3" />,
  nutrition: (
    <>
      <path d="M12 21c4-2 6-5 6-9V5l-6 2-6-2v7c0 4 2 7 6 9Z" />
      <path d="M12 7v12" />
    </>
  ),
  sustainability: <path d="M12 3a9 9 0 1 0 9 9M12 3v9l6-6M12 12 7 8M12 12v5" />,
  animalWelfare: <path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z" />,
  edit: <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6l4 4" />,
  trash: (
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.6l5.9-.8Z" />,
  starFilled: (
    <path
      d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.6l5.9-.8Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shared: (
    <>
      <circle cx="7" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M2.5 19c0-2.5 2-4.5 4.5-4.5S11.5 16.5 11.5 19M12.5 19c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
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
