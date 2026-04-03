import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const BANNED = ["connard","connasse","salope","pute","fdp","fils de pute","enculé","enculer","niquer","nique","ta gueule","batard","bâtard","ordure","bitch","asshole","motherfucker","fucker","cunt","whore","nigger","faggot"];

function sanitize(str, maxLen) {
  if (!str) return "";
  return String(str).replace(/[<>]/g, "").trim().slice(0, maxLen);
}

function containsBanned(text) {
  if (!text) return false;
  const low = text.toLowerCase();
  return BANNED.some(w => low.includes(w));
}

export async function POST(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { gameId, rating, comment, gameTitle, gameCover, userDisplay } = body;

  if (!gameId || typeof rating !== "number" || rating < 1 || rating > 10) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  if (containsBanned(comment)) {
    return Response.json({ error: "Inappropriate content" }, { status: 422 });
  }

  const { error } = await supabase.from("ratings").upsert({
    user_id: user.id,
    game_id: gameId,
    rating: Math.round(rating),
    comment: sanitize(comment, 2000),
    user_display: sanitize(userDisplay, 50),
    game_title: sanitize(gameTitle, 200),
    game_cover: gameCover || null,
  }, { onConflict: "user_id,game_id" });

  if (error) {
    console.error("ratings upsert:", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
