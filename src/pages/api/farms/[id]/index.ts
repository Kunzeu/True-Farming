import * as handlers from '@/app/api/farms/[id]/route';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
export const PUT = adapt(handlers.PUT as any);
export const DELETE = adapt(handlers.DELETE as any);
