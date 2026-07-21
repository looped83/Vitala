import { Link as RouterLink } from 'react-router-dom';
import type { LinkProps as RouterLinkProps } from 'react-router-dom';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './Link.module.css';

type InternalLinkProps = RouterLinkProps & { external?: false };
type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  external: true;
  to?: never;
};

export type AppLinkProps = (InternalLinkProps | ExternalLinkProps) & {
  variant?: 'default' | 'quiet';
  children: ReactNode;
};

/** In-app links use React Router; external links get safe rel attributes. */
export function Link(props: AppLinkProps): React.JSX.Element {
  const { variant = 'default', className, children } = props;
  const classes = cn(styles.link, variant === 'quiet' && styles.quiet, className);

  if (props.external) {
    const { external: _external, variant: _variant, className: _cn, children: _c, ...rest } = props;
    return (
      <a className={classes} rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  const { external: _e, variant: _v, className: _c2, children: _c3, ...rest } = props;
  return (
    <RouterLink className={classes} {...rest}>
      {children}
    </RouterLink>
  );
}
