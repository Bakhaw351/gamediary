export const runtime = "nodejs";

const FEEDS = [
  { url: "https://www.jeuxvideo.com/rss/rss.xml",          source: "JVC" },
  { url: "https://www.eurogamer.net/feed",                  source: "Eurogamer" },
  { url: "https://www.rockpapershotgun.com/feed",           source: "RPS" },
  { url: "https://kotaku.com/rss",                          source: "Kotaku" },
];

function parseRSS(xml, source) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const block of blocks.slice(0, 8)) {
    const get = (tag) =>
      block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ||
      block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() || "";

    const decodeHtml = (s) => s
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#039;/g,"'");
    const title = decodeHtml(get("title"));
    const link  = get("link") || get("guid");
    const date  = get("pubDate");
    const desc  = decodeHtml(get("description").replace(/<[^>]+>/g,"")).slice(0,120);

    const image =
      block.match(/media:content[^>]*url="([^"]+)"/)?.[1] ||
      block.match(/media:thumbnail[^>]*url="([^"]+)"/)?.[1] ||
      block.match(/enclosure[^>]*url="([^"]+)"[^>]*type="image/)?.[1] ||
      block.match(/<img[^>]*src="([^"]+)"/)?.[1] || null;

    if (title && link) items.push({ title, link, date, desc, image, source });
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JoystickLog/1.0; RSS reader)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`${source} ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, source);
    })
  );

  const proxy = (url) => url ? `/api/img-proxy?url=${encodeURIComponent(url)}` : null;

  const items = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value)
    .map(item => ({ ...item, image: proxy(item.image) }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 24);

  return Response.json({ items }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
