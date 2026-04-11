/*
 * Discover route — maps frontend tags to IGDB genre/theme/game_mode IDs
 * and IGDB keyword names (resolved to IDs at runtime).
 *
 * A single IGDB query with an OR clause is used so that offset-based
 * pagination and sort-by-rating work correctly across all pages.
 */

// IGDB genre IDs: 5=Shooter, 8=Platform, 9=Puzzle, 10=Racing, 11=RTS, 12=RPG,
// 13=Simulator, 14=Sport, 15=Strategy, 25=Hack&Slash, 29=Adventure, 31=Arcade,
// 32=Visual Novel, 33=Card&Board
// IGDB theme IDs: 1=Action, 17=Fantasy, 18=Sci-fi, 19=Horror, 20=Thriller,
// 21=Survival, 23=Stealth, 27=Comedy, 31=Drama, 33=Sandbox, 38=Open world,
// 39=Warfare, 43=Mystery
const TAG_MAP = {
  "Open World":   { genres: [],     themes: [38, 33],  game_modes: [],      kw: ["open world"] },
  "RPG":          { genres: [12],   themes: [17],      game_modes: [],      kw: [] },
  "Action":       { genres: [25],   themes: [1],       game_modes: [],      kw: [] },
  "Aventure":     { genres: [29],   themes: [],        game_modes: [],      kw: [] },
  "Platformer":   { genres: [8],    themes: [],        game_modes: [],      kw: ["platformer"] },
  "Roguelike":    { genres: [],     themes: [],        game_modes: [],      kw: ["roguelike", "roguelite", "rogue-like"] },
  "Souls-like":   { genres: [],     themes: [],        game_modes: [],      kw: ["souls-like", "soulslike", "soulsborne"] },
  "Simulation":   { genres: [13],   themes: [33],      game_modes: [],      kw: [] },
  "Rétro":        { genres: [8, 31],themes: [],        game_modes: [],      kw: ["pixel art", "16-bit", "8-bit", "retro"] },
  "Difficile":    { genres: [],     themes: [],        game_modes: [],      kw: ["difficult", "challenging", "hardcore", "permadeath"] },
  "Narratif":     { genres: [29, 32],themes: [31, 43], game_modes: [],     kw: ["visual novel", "narrative", "story-driven"] },
  "Multijoueur":  { genres: [],     themes: [],        game_modes: [2,3,5], kw: [] },
  "Indie":        { genres: [],     themes: [],        game_modes: [],      kw: ["indie", "independent"] },
  "Horreur":      { genres: [],     themes: [19, 20, 21], game_modes: [],  kw: ["horror", "survival horror"] },
  "Sport":        { genres: [14],   themes: [],        game_modes: [],      kw: [] },
  "FPS":          { genres: [5],    themes: [1, 39],   game_modes: [],      kw: ["first-person shooter", "fps"] },
  "Puzzle":       { genres: [9],    themes: [],        game_modes: [],      kw: [] },
};

import { getIgdbToken } from '../igdb-token.js';

const VALID_TAGS = new Set(Object.keys(TAG_MAP));

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Only allow whitelisted tags — no injection possible
  const tags = (searchParams.get('tags') || '').split(',').filter(t => VALID_TAGS.has(t)).slice(0, 10);
  const offset = Math.max(0, Math.min(parseInt(searchParams.get('offset') || '0', 10) || 0, 500));
  if (tags.length === 0) return Response.json([]);

  const access_token = await getIgdbToken();
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

  // ── Resolve keyword names → IGDB keyword IDs (single batched request) ───
  let kwIds = [];
  if (kwTerms.size > 0) {
    const nameConditions = [...kwTerms].map(k => `name ~ *"${k}"*`).join(' | ');
    const kwData = await fetch('https://api.igdb.com/v4/keywords', {
      method: 'POST', headers,
      body: `fields id,name; where ${nameConditions}; limit 20;`,
    }).then(r => r.json()).catch(e => { console.error('IGDB keywords:', e); return []; });
    kwIds = (Array.isArray(kwData) ? kwData : []).filter(k => k?.id).map(k => k.id);
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
  }).then(r => r.json()).catch(e => { console.error('IGDB discover:', e); return []; });

  return Response.json(Array.isArray(data) ? data : []);
}
