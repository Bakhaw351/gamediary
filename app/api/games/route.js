export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const platformId = searchParams.get('platform') || '';

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const { access_token } = await tokenRes.json();

  const platClause = platformId ? ` & platforms = (${platformId})` : '';
  const fields = 'fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,platforms.name,summary,videos.video_id;';

  let body;
  if (query.length >= 2) {
    body = `search "${query}"; ${fields} where cover != null${platClause}; limit 20; offset ${offset};`;
  } else {
    body = `${fields} where rating > 0 & cover != null & total_rating_count > 5${platClause}; sort total_rating_count desc; limit 20; offset ${offset};`;
  }

  const igdbRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'text/plain',
    },
    body,
  });

  const games = await igdbRes.json();
  return Response.json(games);
}