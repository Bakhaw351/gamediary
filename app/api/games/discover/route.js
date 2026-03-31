const TAG_MAP = {
  "Open World":   { themes: [38] },
  "RPG":          { genres: [12] },
  "Action":       { themes: [1] },
  "Aventure":     { genres: [31] },
  "Platformer":   { genres: [8] },
  "Roguelike":    { search: "roguelike" },
  "Metroidvania": { search: "metroidvania" },
  "Souls-like":   { search: "souls" },
  "Simulation":   { genres: [13] },
  "Rétro":        { search: "retro" },
  "Difficile":    { search: "difficult" },
  "Narratif":     { genres: [31, 34] },
  "Multijoueur":  { game_modes: [2, 3, 5] },
  "Indie":        { genres: [32] },
  "Horreur":      { themes: [19] },
  "Sport":        { genres: [14] },
  "FPS":          { genres: [5] },
  "Puzzle":       { genres: [9] },
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tags = (searchParams.get('tags') || '').split(',').filter(Boolean);
  if (tags.length === 0) return Response.json([]);

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

  const fields = 'fields name,cover.url,first_release_date,rating,total_rating_count,genres.name,platforms.name,summary,videos.video_id;';
  const base = 'cover != null & parent_game = null & total_rating_count > 0';

  const genreIds    = new Set();
  const themeIds    = new Set();
  const gameModeIds = new Set();
  const searchTerms = [];

  for (const tag of tags) {
    const m = TAG_MAP[tag];
    if (!m) continue;
    (m.genres     || []).forEach(id => genreIds.add(id));
    (m.themes     || []).forEach(id => themeIds.add(id));
    (m.game_modes || []).forEach(id => gameModeIds.add(id));
    if (m.search) searchTerms.push(m.search);
  }

  const queries = [];

  if (genreIds.size > 0) {
    queries.push(fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where ${base} & genres = (${[...genreIds].join(',')}); sort total_rating_count desc; limit 30;`,
    }).then(r => r.json()));
  }
  if (themeIds.size > 0) {
    queries.push(fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where ${base} & themes = (${[...themeIds].join(',')}); sort total_rating_count desc; limit 20;`,
    }).then(r => r.json()));
  }
  if (gameModeIds.size > 0) {
    queries.push(fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `${fields} where ${base} & game_modes = (${[...gameModeIds].join(',')}); sort total_rating_count desc; limit 20;`,
    }).then(r => r.json()));
  }
  for (const term of searchTerms) {
    queries.push(fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers,
      body: `search "${term}"; ${fields} where cover != null & parent_game = null; limit 15;`,
    }).then(r => r.json()));
  }

  if (queries.length === 0) return Response.json([]);

  const results = await Promise.all(queries);
  const all = results.flat().filter(g => g && g.id && g.cover);
  const unique = [...new Map(all.map(g => [g.id, g])).values()]
    .sort((a, b) => (b.total_rating_count || 0) - (a.total_rating_count || 0))
    .slice(0, 40);

  return Response.json(unique);
}
