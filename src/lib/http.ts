/** Shared JSON helpers for API routes (prefer over ad-hoc Response.json). */
export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

export function jsonError(error: string, status = 400, details?: unknown) {
  return Response.json(details !== undefined ? { error, details } : { error }, { status });
}
