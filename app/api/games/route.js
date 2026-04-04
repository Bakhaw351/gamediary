import { getIgdbToken } from './igdb-token.js';

// Only allow safe characters in search queries (alphanumeric, spaces, common punctuation)
function sanitizeQuery(q) {
  return q.replace(/[^\w\s\-'.,:!?]/g, '').slice(0, 100);
}

function sanitizeId(id) {
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery      = searchParams.get('q') || '';
  const rawOffset     = searchParams.get('offset') || '0';
  const rawPlatformId = searchParams.get('platform') || '';
  const rawGameId     = searchParams.get('id') || '';

  const query      = sanitizeQuery(rawQuery);
  const offset     = Math.max(0, Math.min(parseInt(rawOffset, 10) || 0, 500));
  const platformId = sanitizeId(rawPlatformId);
  const gameId     = sanitizeId(rawGameId);

  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  const fields = 'fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,aggregated_rating,aggregated_rating_count,platforms.name,summary,videos.video_id;';

  // Single game fetch by IGDB id
  if (gameId) {
    const data = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where id = ${gameId}; limit 1;`,
    }).then(r => r.json()).catch(e => { console.error('IGDB game fetch:', e); return []; });
    return Response.json(Array.isArray(data) && data[0] ? data[0] : null);
  }

  const platClause = platformId ? ` & platforms = (${platformId})` : '';

  let body;
  if (query.length >= 2) {
    body = `search "${query}"; ${fields} where parent_game = null${platClause}; limit 20; offset ${offset};`;
  } else {
    body = `${fields} where rating > 0 & cover != null & total_rating_count > 5 & parent_game = null${platClause}; sort total_rating_count desc; limit 20; offset ${offset};`;
  }

  const data = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST', headers, body,
  }).then(r => r.json()).catch(e => { console.error('IGDB search:', e); return []; });

  return Response.json(Array.isArray(data) ? data : []);
}
