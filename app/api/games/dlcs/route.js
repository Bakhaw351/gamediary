import { getIgdbToken } from '../igdb-token.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('id');
  if (!gameId) return Response.json({ dlcs: [], series: [] });

  const access_token = await getIgdbToken();
  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'text/plain',
  };

  // Step 1: fetch the game's dlcs, expansions, and collection (series)
  const gameRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers,
    body: `fields dlcs,expansions,collection; where id = ${gameId};`,
  });
  const [gameData] = await gameRes.json();

  const dlcIds = [
    ...(gameData?.dlcs || []),
    ...(gameData?.expansions || []),
  ];
  const collectionId = gameData?.collection;

  // Run DLC fetch and series fetch in parallel
  const [dlcData, seriesData] = await Promise.all([
    // DLCs
    dlcIds.length > 0
      ? fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers,
          body: `fields name,cover.url,first_release_date,category; where id = (${dlcIds.join(',')}); sort first_release_date asc; limit 20;`,
        }).then(r => r.json())
      : fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers,
          body: `fields name,cover.url,first_release_date,category; where parent_game = ${gameId} & category = (1,2,4); sort first_release_date asc; limit 20;`,
        }).then(r => r.json()),

    // Series (other games in the same collection, exclude itself)
    collectionId
      ? fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers,
          body: `fields name,cover.url,first_release_date,rating; where collection = ${collectionId} & id != ${gameId} & category = 0 & cover != null; sort first_release_date asc; limit 12;`,
        }).then(r => r.json())
      : Promise.resolve([]),
  ]);

  return Response.json({
    dlcs: Array.isArray(dlcData) ? dlcData : [],
    series: Array.isArray(seriesData) ? seriesData : [],
  });
}
