/** @type {import('next').NextConfig} */

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'Strict-Transport-Security',value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline scripts (nonce not available in static export, use strict-dynamic would be ideal but needs nonce)
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      // Styles: self + Google Fonts + inline styles used by React
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + IGDB covers + data URIs
      `img-src 'self' data: https://images.igdb.com`,
      // API calls: Supabase + IGDB (server-side only, but listed for fetch() calls)
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.igdb.com https://id.twitch.tv https://challenges.cloudflare.com`,
      // Frames: YouTube only (trailers)
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      // Objects: none
      "object-src 'none'",
      // Base URI: restrict to self
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
