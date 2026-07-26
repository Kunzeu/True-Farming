import type { APIRoute } from 'astro';

/** Serve R2-uploaded route images when not in public/. */
export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const filename = params.filename;
  if (!filename) return new Response('Not found', { status: 404 });

  const r2 = locals.runtime?.env?.ROUTES_IMAGES;
  if (!r2) return new Response('Not found', { status: 404 });

  const obj = await r2.get(`images/routes/${filename}`);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
};
