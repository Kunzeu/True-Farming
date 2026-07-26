import { NextResponse } from 'next/server';

/** ponytail: ISR revalidate is a no-op on Astro/CF; keep endpoint for callers. */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path: path || null,
      tag: tag || null,
      note: 'Astro/Cloudflare: cache bust via deploy or Cache-Control headers',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
