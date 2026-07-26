import { NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        // Astro pasa Request estándar (sin nextUrl de Next.js)
        const userId = new URL(request.url).searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const result = await pool.query('SELECT gw2_api_key AS "gw2ApiKey" FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0 || !result.rows[0].gw2ApiKey) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        return NextResponse.json({ apiKey: result.rows[0].gw2ApiKey }, {
            headers: { 'Cache-Control': 'no-store, no-cache' },
        });
    } catch (error) {
        console.error('Error fetching token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
