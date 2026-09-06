import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/jwt-utils';
import { pool } from '@/lib/postgres-db';
import { resolveEffectiveRole } from '@/lib/server/site-admin';

export const runtime = 'nodejs';
export const revalidate = 600; // Cache de 10 minutos - Optimizado para Vercel

export async function GET(request: NextRequest) {
    try {
        const authResult = authenticateRequest(request);

        if (!authResult.isAuthenticated || !authResult.user) {
            return NextResponse.json({
                authenticated: false,
                error: authResult.error || 'Not authenticated',
                user: null
            }, { status: 401 });
        }

        // Retornar información completa para diagnóstico
        let role = authResult.user.role;
        let email = authResult.user.email;
        let username = authResult.user.username;

        try {
            const result = await pool.query(
                `SELECT email, username, role FROM users WHERE id = $1`,
                [authResult.user.userId],
            );
            const dbUser = result.rows[0] as { email: string; username: string; role: string } | undefined;
            if (dbUser) {
                email = dbUser.email;
                username = dbUser.username;
                role = resolveEffectiveRole(dbUser.role, dbUser.email, dbUser.username);
            }
        } catch (error) {
            console.error('auth/me role lookup failed:', error);
            role = resolveEffectiveRole(role, email, username);
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: authResult.user.userId, // jwt-utils usa userId en el payload
                username,
                email,
                role,
                isActive: authResult.user.isActive,
                // Incluir claims del token para ver expiración
                iat: authResult.user.iat,
                exp: authResult.user.exp
            },
            timestamp: new Date().toISOString()
        }, {
            headers: {
                // Cache privado de 10 minutos - Optimizado para Vercel
                'Cache-Control': 'private, max-age=600, stale-while-revalidate=120',
            }
        });

    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}
