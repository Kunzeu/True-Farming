import type { ReactNode, ScriptHTMLAttributes } from 'react';
import { useEffect } from 'react';

type Props = ScriptHTMLAttributes<HTMLScriptElement> & {
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive' | 'worker';
  id?: string;
  children?: ReactNode;
};

/** Shim for next/script. */
export default function Script({ strategy: _s, children, dangerouslySetInnerHTML, src, id, ...rest }: Props) {
  useEffect(() => {
    if (src) {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const el = document.createElement('script');
      el.src = src;
      if (id) el.id = id;
      Object.entries(rest).forEach(([k, v]) => {
        if (v != null) el.setAttribute(k, String(v));
      });
      document.body.appendChild(el);
      return;
    }
    const html =
      typeof dangerouslySetInnerHTML === 'object' && dangerouslySetInnerHTML && '__html' in dangerouslySetInnerHTML
        ? String((dangerouslySetInnerHTML as { __html: string }).__html)
        : typeof children === 'string'
          ? children
          : '';
    if (!html) return;
    if (id && document.getElementById(id)) return;
    const el = document.createElement('script');
    if (id) el.id = id;
    el.text = html;
    document.body.appendChild(el);
  }, [src, id]);

  return null;
}
