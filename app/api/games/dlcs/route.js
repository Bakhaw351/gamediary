import { getIgdbToken } from '../igdb-token.js';

function sanitizeId(id) {
  const n = parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = sanitizeId(searchParams.get('id'));
  if (!gameId) return Response.json({ dlcs: [], series: [] });

  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  const gameRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST', headers,
    body: `fields dlcs,expansions,collection,game_versions; where id = ${gameId};`,
  }).catch(e => { console.error('IGDB dlcs game fetch:', e); return null; });

  if (!gameRes) return Response.json({ dlcs: [], series: [], editions: [] });
  const [gameData] = await gameRes.json().catch(() => [{}]);

  const dlcIds = [
    ...(gameData?.dlcs || []),
    ...(gameData?.expansions || []),
  ].filter(id => Number.isFinite(id) && id > 0).slice(0, 30);

  const editionIds = (gameData?.game_versions || [])
    .filter(id => Number.isFinite(id) && id > 0).slice(0, 15);

  const collectionId = Number.isFinite(gameData?.collection) ? gameData.collection : null;

  const [dlcData, seriesData, editionData] = await Promise.all([
    dlcIds.length > 0
      ? fetch('https://api.igdb.com/v4/games', {
          method: 'POST', headers,
          body: `fields name,cover.url,first_release_date,category; where id = (${dlcIds.join(',')}); sort first_release_date asc; limit 20;`,
        }).then(r => r.json()).catch(() => [])
      : fetch('https://api.igdb.com/v4/games', {
          method: 'POST', headers,
          body: `fields name,cover.url,first_release_date,category; where parent_game = ${gameId} & category = (1,2,4); sort first_release_date asc; limit 20;`,
        }).then(r => r.json()).catch(() => []),

    collectionId
      ? fetch('https://api.igdb.com/v4/games', {
          method: 'POST', headers,
          body: `fields name,cover.url,first_release_date,rating; where collection = ${collectionId} & id != ${gameId} & category = 0 & cover != null; sort first_release_date asc; limit 12;`,
        }).then(r => r.json()).catch(() => [])
      : Promise.resolve([]),

    editionIds.length > 0
      ? fetch('https://api.igdb.com/v4/games', {
          method: 'POST', headers,
          body: `fields name,cover.url,first_release_date; where id = (${editionIds.join(',')}); sort first_release_date asc; limit 15;`,
        }).then(r => r.json()).catch(() => [])
      : fetch('https://api.igdb.com/v4/games', {
          method: 'POST', headers,
          body: `fields name,cover.url,first_release_date; where version_parent = ${gameId}; sort first_release_date asc; limit 15;`,
        }).then(r => r.json()).catch(() => []),
  ]);

  return Response.json({
    dlcs:     Array.isArray(dlcData)     ? dlcData     : [],
    series:   Array.isArray(seriesData)  ? seriesData  : [],
    editions: Array.isArray(editionData) ? editionData : [],
  });
}
