/*
 * Discover route — maps frontend tags to IGDB genre/theme/game_mode IDs
 * and IGDB keyword names (resolved to IDs at runtime).
 *
 * A single IGDB query with an OR clause is used so that offset-based
 * pagination and sort-by-rating work correctly across all pages.
 */

const TAG_MAP = {
  "Open World":   { genres: [],     themes: [38],     game_modes: [],      kw: [] },
  "RPG":          { genres: [12],   themes: [],       game_modes: [],      kw: [] },
  "Action":       { genres: [],     themes: [1],      game_modes: [],      kw: [] },
  "Aventure":     { genres: [31],   themes: [],       game_modes: [],      kw: [] },
  "Platformer":   { genres: [8],    themes: [],       game_modes: [],      kw: [] },
  "Roguelike":    { genres: [],     themes: [],       game_modes: [],      kw: ["roguelike", "roguelite"] },
  "Souls-like":   { genres: [],     themes: [],       game_modes: [],      kw: ["souls-like", "soulslike", "soulsborne"] },
  "Simulation":   { genres: [13],   themes: [33],     game_modes: [],      kw: [] },
  "Rétro":        { genres: [],     themes: [],       game_modes: [],      kw: ["retro", "pixel art", "16-bit", "8-bit"] },
  "Difficile":    { genres: [],     themes: [],       game_modes: [],      kw: ["difficult", "challenging", "hardcore"] },
  "Narratif":     { genres: [34],   themes: [31, 43], game_modes: [],      kw: [] },
  "Multijoueur":  { genres: [],     themes: [],       game_modes: [2,3,5], kw: [] },
  "Indie":        { genres: [32],   themes: [],       game_modes: [],      kw: [] },
  "Horreur":      { genres: [],     themes: [19],     game_modes: [],      kw: [] },
  "Sport":        { genres: [14],   themes: [],       game_modes: [],      kw: [] },
  "FPS":          { genres: [5],    themes: [],       game_modes: [],      kw: [] },
  "Puzzle":       { genres: [9],    themes: [],       game_modes: [],      kw: [] },
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tags   = (searchParams.get('tags') || '').split(',').filter(Boolean);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  if (tags.length === 0) return Response.json([]);

  // ── IGDB auth ──────────────────────────────────────────────
  const { access_token } = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  ).then(r => r.json());

  const headers = {
    'Client-ID':     process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type':  'text/plain',
  };

  // ── Collect IDs and keyword terms ──────────────────────────
  const genreIds    = new Set();
  const themeIds    = new Set();
  const gameModeIds = new Set();
  const kwTerms     = new Set();

  for (const tag of tags) {
    const m = TAG_MAP[tag];
    if (!m) continue;
    m.genres.forEach(id => genreIds.add(id));
    m.themes.forEach(id => themeIds.add(id));
    m.game_modes.forEach(id => gameModeIds.add(id));
    m.kw.forEach(k => kwTerms.add(k));
  }

  // ── Resolve keyword names → IGDB keyword IDs (parallel) ───
  let kwIds = [];
  if (kwTerms.size > 0) {
    const kwResults = await Promise.all(
      [...kwTerms].map(term =>
        fetch('https://api.igdb.com/v4/keywords', {
          method: 'POST', headers,
          body: `search "${term}"; fields id,name; limit 3;`,
        }).then(r => r.json()).catch(() => [])
      )
    );
    kwIds = [...new Set(kwResults.flat().filter(k => k?.id).map(k => k.id))];
    if (kwIds.length > 20) kwIds = kwIds.slice(0, 20);
  }

  // ── Build a single OR clause across all tag types ──────────
  // This gives us correct pagination and a single sorted result set.
  const conditions = [];
  if (genreIds.size > 0)    conditions.push(`genres = (${[...genreIds]})`);
  if (themeIds.size > 0)    conditions.push(`themes = (${[...themeIds]})`);
  if (gameModeIds.size > 0) conditions.push(`game_modes = (${[...gameModeIds]})`);
  if (kwIds.length > 0)     conditions.push(`keywords = (${kwIds.join(',')})`);

  if (conditions.length === 0) return Response.json([]);

  const orClause = conditions.length > 1
    ? `(${conditions.join(' | ')})`
    : conditions[0];

  const fields = 'fields name,cover.url,first_release_date,rating,total_rating_count,genres.name,platforms.name,summary,videos.video_id;';
  // Quality filter: must have a cover, no DLC, rated > 55/100 by IGDB community, at least 10 votes
  const base = 'cover != null & parent_game = null & rating != null & rating > 55 & total_rating_count > 10';

  const data = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST', headers,
    body: `${fields} where ${base} & ${orClause}; sort rating desc; limit 20; offset ${offset};`,
  }).then(r => r.json()).catch(() => []);

  return Response.json(Array.isArray(data) ? data : []);
}
