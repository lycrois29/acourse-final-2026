import { NextResponse } from 'next/server';
import { verifyJWT } from './lib/auth';
import corsHeaders from './lib/cors';
export function proxy(request) {
  if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: corsHeaders });
  if (request.nextUrl.pathname === '/api/auth/login') return NextResponse.next();
  if (!verifyJWT(request)) return NextResponse.json({ message: 'Please sign in to continue' }, { status: 401, headers: corsHeaders });
  return NextResponse.next();
}
export const config = { matcher: ['/api/:path*'] };
