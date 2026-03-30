export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('id');
  if (!gameId) return Response.json([]);

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const { access_token } = await tokenRes.json();

  // category 1 = DLC/addon, 2 = expansion, 4 = standalone expansion
  const igdbRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'text/plain',
    },
    body: `fields name,cover.url,first_release_date,category,summary; where parent_game = ${gameId} & category = (1,2,4) & cover != null; limit 20;`,
  });

  const data = await igdbRes.json();
  return Response.json(Array.isArray(data) ? data : []);
}
