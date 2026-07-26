import type { APIRoute } from 'astro';
import * as handlers from '@/app/api/users/[id]/validate-api/route';

type Ctx = Parameters<APIRoute>[0];

function adapt(fn: Function): APIRoute {
  return async (ctx: Ctx) => {
    const params = { ...(ctx.params as Record<string, string | undefined>) };
    return fn(ctx.request, { params: Promise.resolve(params), locals: ctx.locals });
  };
}

export const prerender = false;
export const POST = adapt(handlers.POST as any);
