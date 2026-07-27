import * as handlers from '@/app/api/auth/patreon/token/route';
import { adapt } from '@/lib/astro-api-adapt';

export const prerender = false;
export const POST = adapt(handlers.POST as any);
