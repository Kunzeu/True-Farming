import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

// API interna para búsquedas de autenticación
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const username = searchParams.get('username');
  const discordId = searchParams.get('discordId');
  const patreonId = searchParams.get('patreonId');

  try {
    // API interna para autenticación - verificación simplificada
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    // Permitir peticiones desde el mismo dominio o localhost
    const isAllowedOrigin = !origin || (
      origin.includes('true-farming.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('.pages.dev') ||
      origin.includes('.workers.dev')
    );
    
    const isAllowedReferer = !referer || (
      referer.includes('/login') ||
      referer.includes('/register') ||
      referer.includes('/profile') ||
      referer.includes('/auth/') ||
      referer.includes('localhost') ||
      referer.includes('127.0.0.1') ||
      referer.includes('true-farming.com') ||
      referer.includes('.pages.dev') ||
      referer.includes('.workers.dev')
    );
    
    // Permitir si es del origen correcto o tiene referer correcto
    if (!isAllowedOrigin && !isAllowedReferer) {
      return NextResponse.json({ 
        error: 'Unauthorized. This endpoint is only accessible for authentication purposes.' 
      }, { status: 403 });
    }

    if (email) {
      // Buscar por email (para login)
      const query = `
        SELECT id, email, username, password, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus",
               preferences, gw2_api_key as "gw2ApiKey"
        FROM users 
        WHERE email = $1
      `;
      
      const result = await pool.query(query, [email]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });
      
    } else if (username) {
      // Buscar por username
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus",
               preferences, gw2_api_key as "gw2ApiKey"
        FROM users 
        WHERE username = $1
      `;
      
      const result = await pool.query(query, [username]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });
      
    } else if (discordId) {
      // Buscar por Discord ID
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus",
               preferences, gw2_api_key as "gw2ApiKey"
        FROM users 
        WHERE discord_id = $1
      `;
      
      const result = await pool.query(query, [discordId]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });
    } else if (patreonId) {
      // Buscar por Patreon ID
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus",
               preferences, gw2_api_key as "gw2ApiKey"
        FROM users 
        WHERE patreon_id = $1
      `;
      
      const result = await pool.query(query, [patreonId]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });
    } else {
      return NextResponse.json({ error: 'No search parameter provided' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json({ 
      error: 'Error searching user', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
