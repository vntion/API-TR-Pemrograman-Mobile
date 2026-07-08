import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from './utils/client';

const PUBLIC_ROUTE = ['/', '/docs', '/api/login', '/api/auth/login', '/docs'];

export async function middleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname;

  if (
    PUBLIC_ROUTE.some(route =>
      route === '/' ? pathName === route : pathName.startsWith(route),
    )
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Token tidak ditemukan atau format salah' },
      { status: 401 },
    );
  }

  const token = authHeader.split(' ')[1];

  const { data: session } = await supabaseClient()
    .from('session_tokens')
    .select('expires_at')
    .eq('token', token)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabaseClient().from('session_tokens').delete().eq('token', token);

    return NextResponse.json(
      { error: 'Token sudah kadaluwarsa', status: false },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
