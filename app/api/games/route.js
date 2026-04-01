import { getIgdbToken } from './igdb-token.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const platformId = searchParams.get('platform') || '';
  const gameId = searchParams.get('id') || '';

  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  const fields = 'fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,platforms.name,summary,videos.video_id;';

  // Single game fetch by IGDB id
  if (gameId) {
    const data = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where id = ${gameId}; limit 1;`,
    }).then(r => r.json()).catch(() => []);
    return Response.json(Array.isArray(data) && data[0] ? data[0] : null);
  }

  const platClause = platformId ? ` & platforms = (${platformId})` : '';

  let body;
  if (query.length >= 2) {
    body = `search "${query}"; ${fields} where cover != null & parent_game = null${platClause}; limit 20; offset ${offset};`;
  } else {
    body = `${fields} where rating > 0 & cover != null & total_rating_count > 5 & parent_game = null${platClause}; sort total_rating_count desc; limit 20; offset ${offset};`;
  }

  const igdbRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST', headers, body,
  });

  const games = await igdbRes.json();
  return Response.json(games);
}