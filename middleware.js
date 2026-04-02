import { NextResponse } from 'next/server';

// In-memory rate limit store (per Vercel instance — good enough for edge protection)
// Key: IP, Value: { count, resetAt }
const rateLimitStore = new Map();

const LIMITS = {
  '/api/games/home':     { max: 30,  window: 60_000  }, // 30 req/min (cached anyway)
  '/api/games/discover': { max: 20,  window: 60_000  }, // 20 req/min
  '/api/games/dlcs':     { max: 30,  window: 60_000  }, // 30 req/min
  '/api/games':          { max: 60,  window: 60_000  }, // 60 req/min (search)
  default:               { max: 100, window: 60_000  },
};

function getLimit(pathname) {
  for (const [path, limit] of Object.entries(LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) return limit;
  }
  return LIMITS.default;
}

function getIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  const ip = getIp(request);
  const key = `${ip}:${pathname}`;
  const { max, window: windowMs } = getLimit(pathname);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return NextResponse.next();
  }

  if (entry.count >= max) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      },
    });
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
