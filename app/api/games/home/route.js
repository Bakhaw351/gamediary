export async function GET() {
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

  const now = Math.floor(Date.now() / 1000);
  const twelveMonthsAgo = now - 365 * 24 * 3600;
  const fields = 'fields name,cover.url,first_release_date,rating,total_rating_count,genres.name,platforms.name,summary,videos.video_id;';

  const [trending, upcoming, gems] = await Promise.all([
    // Trending: games released in last 12 months with decent ratings
    fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `${fields} where cover != null & parent_game = null & first_release_date > ${twelveMonthsAgo} & first_release_date < ${now} & rating > 60 & total_rating_count > 3; sort total_rating_count desc; limit 20;`,
    }).then(r => r.json()),

    // Upcoming: future releases sorted by hype
    fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `fields name,cover.url,first_release_date,hypes,genres.name,platforms.name,summary; where cover != null & parent_game = null & first_release_date > ${now}; sort hypes desc; limit 20;`,
    }).then(r => r.json()),

    // Hidden gems: high rating but under the radar
    fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `${fields} where cover != null & parent_game = null & rating > 82 & total_rating_count >= 5 & total_rating_count < 300; sort rating desc; limit 20;`,
    }).then(r => r.json()),
  ]);

  return Response.json({
    trending: Array.isArray(trending) ? trending : [],
    upcoming: Array.isArray(upcoming) ? upcoming : [],
    gems:     Array.isArray(gems)     ? gems     : [],
  });
}
