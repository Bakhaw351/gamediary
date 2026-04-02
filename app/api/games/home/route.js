import { getIgdbToken } from '../igdb-token.js';

// Cache this route for 1 hour — IGDB data doesn't change minute by minute
export const revalidate = 3600;

export async function GET() {
  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  const now = Math.floor(Date.now() / 1000);
  const twelveMonthsAgo = now - 365 * 24 * 3600;
  const fields = 'fields name,cover.url,first_release_date,rating,total_rating_count,aggregated_rating,aggregated_rating_count,genres.name,platforms.name,summary,videos.video_id;';

  const [trending, upcoming, gems, top] = await Promise.all([
    fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where cover != null & parent_game = null & first_release_date > ${twelveMonthsAgo} & first_release_date < ${now} & rating > 60 & total_rating_count > 3; sort total_rating_count desc; limit 20;`,
    }).then(r => r.json()).catch(() => []),

    fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `fields name,cover.url,first_release_date,hypes,genres.name,platforms.name,summary; where cover != null & parent_game = null & first_release_date > ${now}; sort hypes desc; limit 20;`,
    }).then(r => r.json()).catch(() => []),

    fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where cover != null & parent_game = null & rating > 82 & total_rating_count >= 5 & total_rating_count < 300; sort rating desc; limit 20;`,
    }).then(r => r.json()).catch(() => []),

    fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where cover != null & parent_game = null & rating > 75 & total_rating_count > 200; sort total_rating_count desc; limit 12;`,
    }).then(r => r.json()).catch(() => []),
  ]);

  return Response.json({
    trending: Array.isArray(trending) ? trending : [],
    upcoming: Array.isArray(upcoming) ? upcoming : [],
    gems:     Array.isArray(gems)     ? gems     : [],
    top:      Array.isArray(top)      ? top      : [],
  });
}
