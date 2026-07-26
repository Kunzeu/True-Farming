/** Shim for next/cache. */
export function revalidatePath(_path?: string) {}
export function revalidateTag(_tag?: string) {}
export function unstable_cache<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}
export function unstable_noStore() {}
