import * as handlers from '@/app/api/users/[id]/api-key/route';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
export const GET = adapt(handlers.GET as any);
export const PUT = adapt(handlers.PUT as any);
export const DELETE = adapt(handlers.DELETE as any);
