// Module-level token cache — survives across requests in the same server instance
let cached = null;

export async function getIgdbToken() {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const { access_token, expires_in } = await res.json();
  cached = { token: access_token, expiresAt: now + expires_in * 1000 };
  return access_token;
}
