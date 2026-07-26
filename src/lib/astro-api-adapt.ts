import type { APIRoute } from 'astro';

type Ctx = Parameters<APIRoute>[0];

/** Next handlers esperan `request.nextUrl`; Astro solo pasa `Request`. */
function withNextUrl(request: Request): Request {
  if ((request as Request & { nextUrl?: URL }).nextUrl) return request;
  Object.defineProperty(request, 'nextUrl', {
    value: new URL(request.url),
    enumerable: false,
    configurable: true,
  });
  return request;
}

/** Adapta un handler estilo Next (request, { params }) a APIRoute de Astro. */
export function adapt(fn: Function): APIRoute {
  return async (ctx: Ctx) => {
    const params = { ...(ctx.params as Record<string, string | undefined>) };
    return fn(withNextUrl(ctx.request), {
      params: Promise.resolve(params),
      locals: ctx.locals,
    });
  };
}
