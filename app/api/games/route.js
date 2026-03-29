export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const browse = searchParams.get('browse') === '1';

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const { access_token } = await tokenRes.json();

  const igdbRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'text/plain',
    },
    body: browse
      ? `fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,platforms.name,summary,videos.video_id; where rating > 0 & cover != null & total_rating_count > 5; sort total_rating_count desc; limit 20; offset ${offset};`
      : `search "${query}"; fields name,cover.url,first_release_date,genres.name,rating,total_rating_count,platforms.name,summary,videos.video_id; limit 20; offset ${offset};`,
  });

  const games = await igdbRes.json();
  return Response.json(games);
}