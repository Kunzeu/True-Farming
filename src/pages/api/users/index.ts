import * as handlers from '@/app/api/users/route';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
export const GET = adapt(handlers.GET as any);
export const POST = adapt(handlers.POST as any);
