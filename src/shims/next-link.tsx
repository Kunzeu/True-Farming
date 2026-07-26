import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
  passHref?: boolean;
  legacyBehavior?: boolean;
};

/** Shim for next/link — plain anchor (full page nav is fine for islands). */
export default function Link({ href, children, replace: _r, prefetch: _p, scroll: _s, shallow: _sh, locale: _l, passHref: _ph, legacyBehavior: _lb, ...rest }: Props) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
