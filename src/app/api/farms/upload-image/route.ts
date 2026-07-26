import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { authorizeRequest } from '@/lib/server/jwt-utils';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function extOf(file: File): string {
  return EXT_BY_MIME[file.type] || (file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '.webp');
}

export async function POST(request: Request, context?: { locals?: App.Locals }) {
  try {
    const authResult = authorizeRequest(request, 'moderator');
    if (!authResult.isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authResult.error },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const farmId = String(formData.get('farmId') || '').trim();
    const farmName = String(formData.get('farmName') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, WebP or GIF.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 3 MB.' }, { status: 400 });
    }

    const filename = `${slugify(farmName) || slugify(farmId) || 'route'}-${randomBytes(4).toString('hex')}${extOf(file)}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    // Prefer R2 on Cloudflare; fallback to local public/ for `astro dev`
    // Astro v6+: never use locals.runtime.env (removed); use cloudflare:workers.
    const { getWorkerEnv } = await import('@/lib/cf-env');
    const r2 = (await getWorkerEnv())?.ROUTES_IMAGES;
    if (r2) {
      await r2.put(`images/routes/${filename}`, buffer, {
        httpMetadata: { contentType: file.type },
      });
    } else {
      const { writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const routesDir = join(process.cwd(), 'public', 'images', 'routes');
      await mkdir(routesDir, { recursive: true });
      await writeFile(join(routesDir, filename), buffer);
    }

    return NextResponse.json({ url: `/images/routes/${filename}`, filename });
  } catch (error) {
    console.error('Route image upload failed:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
