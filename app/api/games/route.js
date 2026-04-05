import { getIgdbToken } from './igdb-token.js';

function sanitizeQuery(q) {
  return q.replace(/[^\w\s\-'.,:!?]/g, '').slice(0, 100);
}

function sanitizeId(id) {
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const IGDB_FIELDS = 'fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,aggregated_rating,aggregated_rating_count,platforms.name,summary,videos.video_id;';

async function fetchIgdb(body, headers) {
  try {
    const data = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers, body,
    }).then(r => r.json());
    return Array.isArray(data) ? data : [];
  } catch(e) { console.error('IGDB error:', e); return []; }
}

async function fetchRawg(query, offset = 0) {
  const key = process.env.RAWG_API_KEY;
  if (!key) return [];
  try {
    const page = Math.floor(offset / 20) + 1;
    const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(query)}&page_size=10&page=${page}&search_precise=true`;
    const data = await fetch(url).then(r => r.json());
    if (!Array.isArray(data?.results)) return [];
    // Normalize to IGDB-like shape
    return data.results.map(r => ({
      id: `rawg_${r.id}`,
      name: r.name,
      cover: r.background_image ? { url: r.background_image, _rawg: true } : null,
      first_release_date: r.released ? Math.floor(new Date(r.released).getTime() / 1000) : null,
      genres: r.genres?.map(g => ({ name: g.name })) || [],
      platforms: r.platforms?.map(p => ({ name: p.platform.name })) || [],
      rating: r.rating ? r.rating * 20 : null,
      total_rating_count: r.ratings_count || 0,
      aggregated_rating: r.metacritic || null,
      aggregated_rating_count: null,
      summary: "",
      videos: [],
      _source: "rawg",
    }));
  } catch(e) { console.error('RAWG error:', e); return []; }
}

async function fetchRawgById(rawgId) {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;
  try {
    const data = await fetch(`https://api.rawg.io/api/games/${rawgId}?key=${key}`).then(r => r.json());
    if (!data?.id) return null;
    return {
      id: `rawg_${data.id}`,
      name: data.name,
      cover: data.background_image ? { url: data.background_image, _rawg: true } : null,
      first_release_date: data.released ? Math.floor(new Date(data.released).getTime() / 1000) : null,
      genres: data.genres?.map(g => ({ name: g.name })) || [],
      platforms: data.platforms?.map(p => ({ name: p.platform.name })) || [],
      rating: data.rating ? data.rating * 20 : null,
      total_rating_count: data.ratings_count || 0,
      aggregated_rating: data.metacritic || null,
      aggregated_rating_count: null,
      summary: data.description_raw || "",
      videos: [],
      _source: "rawg",
    };
  } catch(e) { console.error('RAWG id error:', e); return null; }
}

function normalize(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergeResults(igdbResults, rawgResults) {
  const seen = new Set(igdbResults.map(g => normalize(g.name)));
  const unique = rawgResults.filter(g => !seen.has(normalize(g.name)));
  return [...igdbResults, ...unique];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery  = searchParams.get('q') || '';
  const rawOffset = searchParams.get('offset') || '0';
  const rawPlatId = searchParams.get('platform') || '';
  const rawGameId = searchParams.get('id') || '';
  const rawRawgId = searchParams.get('rawgId') || '';

  const query    = sanitizeQuery(rawQuery);
  const offset   = Math.max(0, Math.min(parseInt(rawOffset, 10) || 0, 500));
  const platId   = sanitizeId(rawPlatId);
  const gameId   = sanitizeId(rawGameId);
  const rawgId   = sanitizeId(rawRawgId);

  // Fetch single RAWG game by id
  if (rawgId) {
    const data = await fetchRawgById(rawgId);
    return Response.json(data);
  }

  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  // Single IGDB game by id
  if (gameId) {
    const data = await fetchIgdb(
      `${IGDB_FIELDS} where id = ${gameId}; limit 1;`,
      headers
    );
    return Response.json(data[0] || null);
  }

  const platClause = platId ? ` & platforms = (${platId})` : '';

  if (query.length >= 2) {
    // Query both APIs in parallel
    const [igdbData, rawgData] = await Promise.all([
      fetchIgdb(
        `search "${query}"; ${IGDB_FIELDS} where parent_game = null${platClause}; limit 20; offset ${offset};`,
        headers
      ),
      fetchRawg(query, offset),
    ]);
    return Response.json(mergeResults(igdbData, rawgData));
  } else {
    // Default listing — IGDB only (RAWG has no good "top games" sort)
    const data = await fetchIgdb(
      `${IGDB_FIELDS} where rating > 0 & cover != null & total_rating_count > 5 & parent_game = null${platClause}; sort total_rating_count desc; limit 20; offset ${offset};`,
      headers
    );
    return Response.json(data);
  }
}
