export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('id');
  if (!gameId) return Response.json([]);

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const { access_token } = await tokenRes.json();

  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  // Step 1: fetch the game's dlcs + expansions IDs
  const gameRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers,
    body: `fields dlcs,expansions; where id = ${gameId};`,
  });
  const [gameData] = await gameRes.json();
  const ids = [
    ...(gameData?.dlcs || []),
    ...(gameData?.expansions || []),
  ];

  if (ids.length === 0) {
    // fallback: query by parent_game without cover requirement
    const fallbackRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `fields name,cover.url,first_release_date,category; where parent_game = ${gameId} & category = (1,2,4); sort first_release_date asc; limit 20;`,
    });
    const fallback = await fallbackRes.json();
    return Response.json(Array.isArray(fallback) ? fallback : []);
  }

  // Step 2: fetch details for those IDs
  const detailRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers,
    body: `fields name,cover.url,first_release_date,category; where id = (${ids.join(',')}); sort first_release_date asc; limit 20;`,
  });
  const data = await detailRes.json();
  return Response.json(Array.isArray(data) ? data : []);
}
