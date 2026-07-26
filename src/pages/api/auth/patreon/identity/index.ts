import * as handlers from '@/app/api/auth/patreon/identity/route';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
export const GET = adapt(handlers.GET as any);