import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

/** Shim for next/dynamic → React.lazy + Suspense. */
export default function dynamic<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T } | T>,
  options: DynamicOptions = {}
) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    if (mod && typeof mod === 'object' && 'default' in mod) return mod as { default: T };
    return { default: mod as T };
  });

  function DynamicComponent(props: Record<string, unknown>) {
    return (
      <Suspense fallback={options.loading ? options.loading() : null}>
        <Lazy {...(props as any)} />
      </Suspense>
    );
  }

  return DynamicComponent;
}
