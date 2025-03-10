import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we'll modify
    const res = NextResponse.next();

    // Create a Supabase client
    const supabase = createMiddlewareClient({ req: request, res });

    // Verify the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check rate limit
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_middleware_${ip}`
    );

    // Set rate limit headers
    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());

    // If rate limit exceeded, return 429
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Security headers
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    // API route protection
    if (request.nextUrl.pathname.startsWith('/api/')) {
      if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      // Validate subscription status for premium endpoints
      if (request.nextUrl.pathname.startsWith('/api/premium/')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.subscription_status !== 'premium') {
          return new NextResponse('Subscription Required', { status: 402 });
        }
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 