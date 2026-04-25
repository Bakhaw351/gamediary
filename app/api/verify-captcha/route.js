export const runtime = "edge";

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) return Response.json({ success: false }, { status: 400 });

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });
    const data = await res.json();
    return Response.json({ success: !!data.success });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
