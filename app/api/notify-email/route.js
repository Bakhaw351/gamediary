import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

const FROM = "JoystickLog <contact@joystick-log.com>";
const BASE_URL = "https://joystick-log.com";

function buildEmail(type, fromUser, gameTitle) {
  if (type === "like") {
    return {
      subject: `❤️ ${fromUser} a aimé ton avis`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09080e;color:#ddd8d2;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#ff6b35,#ffd166);padding:24px 32px">
            <div style="font-size:22px;font-weight:800;color:#0a0600;letter-spacing:-.5px">JoystickLog</div>
          </div>
          <div style="padding:32px">
            <p style="font-size:16px;margin:0 0 12px"><strong style="color:#ff6b35">${fromUser}</strong> a aimé ton avis sur <strong style="color:#fff">${gameTitle}</strong>.</p>
            <p style="color:rgba(255,255,255,.4);font-size:13px;margin:0 0 24px">Va voir ce qui se passe sur ton profil.</p>
            <a href="${BASE_URL}?tab=profile" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ffd166);color:#0a0600;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px">Voir mon profil →</a>
          </div>
          <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.2)">Tu reçois cet email car tu as un compte JoystickLog. <a href="${BASE_URL}" style="color:rgba(255,107,53,.5)">Gérer mes préférences</a></div>
        </div>`,
    };
  }
  if (type === "reply") {
    return {
      subject: `💬 ${fromUser} a répondu à ton avis`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09080e;color:#ddd8d2;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#ff6b35,#ffd166);padding:24px 32px">
            <div style="font-size:22px;font-weight:800;color:#0a0600;letter-spacing:-.5px">JoystickLog</div>
          </div>
          <div style="padding:32px">
            <p style="font-size:16px;margin:0 0 12px"><strong style="color:#ff6b35">${fromUser}</strong> a répondu à ton avis sur <strong style="color:#fff">${gameTitle}</strong>.</p>
            <p style="color:rgba(255,255,255,.4);font-size:13px;margin:0 0 24px">Regarde ce qu'il a dit !</p>
            <a href="${BASE_URL}?game=${encodeURIComponent(gameTitle)}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ffd166);color:#0a0600;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px">Voir la réponse →</a>
          </div>
          <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.2)">Tu reçois cet email car tu as un compte JoystickLog. <a href="${BASE_URL}" style="color:rgba(255,107,53,.5)">Gérer mes préférences</a></div>
        </div>`,
    };
  }
  if (type === "follow") {
    return {
      subject: `👤 ${fromUser} te suit maintenant`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09080e;color:#ddd8d2;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#ff6b35,#ffd166);padding:24px 32px">
            <div style="font-size:22px;font-weight:800;color:#0a0600;letter-spacing:-.5px">JoystickLog</div>
          </div>
          <div style="padding:32px">
            <p style="font-size:16px;margin:0 0 12px"><strong style="color:#ff6b35">${fromUser}</strong> te suit maintenant sur JoystickLog.</p>
            <p style="color:rgba(255,255,255,.4);font-size:13px;margin:0 0 24px">Regarde son profil et suis-le en retour si tu veux.</p>
            <a href="${BASE_URL}?user=${encodeURIComponent(fromUser)}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ffd166);color:#0a0600;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px">Voir son profil →</a>
          </div>
          <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.2)">Tu reçois cet email car tu as un compte JoystickLog. <a href="${BASE_URL}" style="color:rgba(255,107,53,.5)">Gérer mes préférences</a></div>
        </div>`,
    };
  }
  return null;
}

export async function POST(request) {
  // Auth check — caller must be a logged-in user
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

  const { type, to_user_id, from_user, game_title } = body;
  if (!type || !to_user_id) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  // Don't email yourself
  if (to_user_id === user.id) {
    return Response.json({ ok: true });
  }

  // Look up target user's email using service role key
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: { user: target } } = await admin.auth.admin.getUserById(to_user_id);
  if (!target?.email) {
    return Response.json({ ok: true }); // no email found, skip silently
  }

  const email = buildEmail(type, from_user, game_title);
  if (!email) return Response.json({ ok: true });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to: target.email, ...email });
  } catch (e) {
    console.error("resend error:", e);
    // don't fail the request if email fails
  }

  return Response.json({ ok: true });
}
