export const runtime = "nodejs";

const ALLOWED_HOSTS = [
  "image.jeuxvideo.com",
  "assetsio.gnwcdn.com",
  "assets1.ignimgs.com",
  "sm.ign.com",
  "imageio.forbes.com",
  "images.ctfassets.net",
  "kotaku.com",
  "cdn.vox-cdn.com",
  "www.pcgamer.com",
  "cdn.mos.cms.futurecdn.net",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  let parsed;
  try { parsed = new URL(url); } catch { return new Response("Invalid url", { status: 400 }); }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
    return new Response("Forbidden host", { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "Referer": parsed.origin,
        "User-Agent": "Mozilla/5.0 (compatible; JoystickLog/1.0)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    const body = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "image/jpeg";
    return new Response(body, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}
