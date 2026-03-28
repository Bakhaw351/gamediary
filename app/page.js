"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ─── CONSTANTS ─────────────────────────────────────────── */
const POPULAR_QUERIES = ["zelda", "mario", "elden", "god of war", "hades", "cyberpunk", "pokemon", "sonic"];
const PLATFORMS_FILTER = ["Tous", "PS5", "PS4", "Nintendo Switch", "PC", "Xbox Series X", "Mobile", "Game Boy Advance"];
const ALL_TAGS_STATIC = ["Open World","RPG","Action","Aventure","Platformer","Roguelike","Metroidvania","Souls-like","Simulation","Rétro","Difficile","Narratif","Multijoueur","Indie"];

/* ─── UTILS ─────────────────────────────────────────────── */
const formatRating = (r) => r ? Math.min(10, Math.round(r / 10)) : null;
const formatCover = (url) => url ? `https:${url.replace("t_thumb", "t_cover_big")}` : null;
const formatYear = (ts) => ts ? new Date(ts * 1000).getFullYear() : "—";
const formatGame = (g) => ({
  id: g.id,
  title: g.name || "Inconnu",
  platform: g.platforms?.[0]?.name || "Multi-plateforme",
  year: formatYear(g.first_release_date),
  genre: g.genres?.[0]?.name || "Jeu vidéo",
  cover: formatCover(g.cover?.url),
  rating: formatRating(g.rating),
  reviews: g.total_rating_count || 0,
  tags: g.genres?.map(x => x.name).slice(0, 4) || [],
  summary: g.summary || "",
});

const rc = (r) => {
  if (!r) return "rgba(255,255,255,.3)";
  if (r >= 8) return "#76ff47";
  if (r >= 6) return "#ffb800";
  return "#ff4d4d";
};

/* ─── CSS ────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #070809; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #76b900; border-radius: 99px; }
  textarea, input, button { font-family: 'DM Sans', sans-serif; }
  
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse    { 0%,100% { opacity:.5; } 50% { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes shimmer  { from { background-position:-400px 0; } to { background-position:400px 0; } }

  .fade-up   { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
  .fade-up-2 { animation: fadeUp .4s .1s cubic-bezier(.4,0,.2,1) both; }
  .fade-up-3 { animation: fadeUp .4s .2s cubic-bezier(.4,0,.2,1) both; }

  .card {
    cursor: pointer;
    border-radius: 14px;
    overflow: hidden;
    background: #0e1011;
    border: 1px solid rgba(255,255,255,.06);
    transition: transform .28s cubic-bezier(.34,1.4,.64,1), box-shadow .28s, border-color .2s;
  }
  .card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(118,185,0,.45);
    box-shadow: 0 16px 48px rgba(118,185,0,.1), 0 0 0 1px rgba(118,185,0,.15);
  }
  .card img { transition: transform .4s ease; }
  .card:hover img { transform: scale(1.06); }

  .row-item {
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: 12px;
    transition: background .2s, border-color .2s;
    cursor: pointer;
  }
  .row-item:hover {
    background: rgba(118,185,0,.04);
    border-color: rgba(118,185,0,.2);
  }

  .btn-primary {
    background: linear-gradient(135deg, #76b900, #8fd100);
    color: #050505;
    border: none;
    border-radius: 10px;
    padding: 11px 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: opacity .2s, transform .15s;
    letter-spacing: .3px;
  }
  .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  .input-field {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px;
    color: #e8eaed;
    padding: 12px 16px;
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: border-color .2s, background .2s;
  }
  .input-field:focus { border-color: #76b900; background: rgba(255,255,255,.07); }
  .input-field::placeholder { color: rgba(255,255,255,.3); }

  .skeleton {
    background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 10px;
  }

  .nav-tab {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 9px;
    padding: 7px 16px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all .18s;
    color: rgba(255,255,255,.35);
    letter-spacing: -.1px;
  }
  .nav-tab:hover { color: rgba(255,255,255,.7); }
  .nav-tab.active {
    background: rgba(118,185,0,.12);
    border-color: rgba(118,185,0,.3);
    color: #76ff47;
  }

  .plat-chip {
    background: transparent;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 99px;
    padding: 5px 15px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    cursor: pointer;
    transition: all .18s;
    color: rgba(255,255,255,.35);
    white-space: nowrap;
  }
  .plat-chip:hover { border-color: #76b900; color: #76b900; }
  .plat-chip.active { background: rgba(118,185,0,.12); border-color: rgba(118,185,0,.4); color: #76b900; }

  .tag-chip {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 8px;
    padding: 7px 15px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    cursor: pointer;
    transition: all .18s;
    color: rgba(255,255,255,.35);
  }
  .tag-chip:hover { background: rgba(118,185,0,.08); border-color: rgba(118,185,0,.3); color: #76b900; }
  .tag-chip.active { background: rgba(118,185,0,.12); border-color: rgba(118,185,0,.4); color: #76ff47; box-shadow: 0 0 12px rgba(118,185,0,.12); }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(118,185,0,.2);
    border-top-color: #76b900;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .grid-mobile-2 { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-title { font-size: 42px !important; }
    .nav-center { gap: 2px !important; }
    .nav-tab { padding: 6px 10px !important; font-size: 11px !important; }
  }
`;

/* ─── RING COMPONENT ─────────────────────────────────────── */
const Ring = ({ value, size = 52 }) => {
  const color = rc(value);
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value ? (value / 10) * circ : 0;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={3.5} />
      {value && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={value ? color : "rgba(255,255,255,.2)"}
        fontSize={size < 44 ? 10 : 12} fontWeight="800" fontFamily="'Syne',sans-serif">
        {value || "—"}
      </text>
    </svg>
  );
};

/* ─── GAME CARD ──────────────────────────────────────────── */
const GameCard = ({ game, onClick, rank }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)}>
      <div style={{ position: "relative", paddingBottom: "140%", background: "#0a0b0c" }}>
        {game.cover && !imgErr ? (
          <img src={game.cover} onError={() => setImgErr(true)} alt={game.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #0e1011, #111)" }}>
            <span style={{ fontSize: 36 }}>🎮</span>
            <span style={{ color: "rgba(255,255,255,.2)", fontSize: 11, textAlign: "center", padding: "0 12px", fontFamily: "'Syne',sans-serif", lineHeight: 1.3 }}>{game.title}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, transparent 45%, rgba(7,8,9,.97) 100%)" }} />
        {rank && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(118,185,0,.9)", color: "#050505", borderRadius: 7, padding: "2px 9px", fontSize: 11, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>#{rank}</div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10 }}><Ring value={game.rating} size={42} /></div>
        <div style={{ position: "absolute", bottom: 10, left: 10 }}>
          <span style={{ background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "rgba(255,255,255,.55)", fontFamily: "'Syne',sans-serif" }}>
            {game.platform.length > 14 ? game.platform.slice(0, 14) + "…" : game.platform}
          </span>
        </div>
      </div>
      <div style={{ padding: "11px 13px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.88)", fontFamily: "'Syne',sans-serif", lineHeight: 1.3, marginBottom: 3 }}>
          {game.title.length > 24 ? game.title.slice(0, 24) + "…" : game.title}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", fontFamily: "'DM Sans',sans-serif" }}>{game.genre} · {game.year}</div>
      </div>
    </div>
  );
};

/* ─── FEATURED CARD ──────────────────────────────────────── */
const FeaturedCard = ({ game, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)} style={{ borderRadius: 18 }}>
      <div style={{ position: "relative", height: 300 }}>
        {game.cover && !imgErr ? (
          <img src={game.cover} onError={() => setImgErr(true)} alt={game.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🎮</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,8,9,1) 0%, rgba(7,8,9,.5) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <span style={{ background: "rgba(118,185,0,.92)", color: "#050505", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>#1</span>
        </div>
        <div style={{ position: "absolute", top: 12, right: 12 }}><Ring value={game.rating} size={50} /></div>
        <div style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>{game.platform} · {game.year}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", lineHeight: 1.2 }}>{game.title}</div>
        </div>
      </div>
    </div>
  );
};

/* ─── SKELETON LOADER ────────────────────────────────────── */
const SkeletonCard = () => (
  <div style={{ borderRadius: 14, overflow: "hidden", background: "#0e1011", border: "1px solid rgba(255,255,255,.05)" }}>
    <div className="skeleton" style={{ paddingBottom: "140%" }} />
    <div style={{ padding: "11px 13px 14px" }}>
      <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 11, width: "50%" }} />
    </div>
  </div>
);

/* ─── AUTH MODAL ─────────────────────────────────────────── */
const AuthModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    if (password.length < 6) { setError("Mot de passe trop court (6 caractères min)."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "login") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onSuccess(data.user);
        onClose();
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        if (data.user && !data.user.identities?.length) throw new Error("Email déjà utilisé.");
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, username: username || email.split("@")[0] });
        }
        setSuccess("Compte créé ! Vérifie ton email pour confirmer.");
      }
    } catch (e) {
      setError(e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : e.message);
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.82)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, borderRadius: 20, background: "rgba(11,12,13,.98)", border: "1px solid rgba(255,255,255,.08)", overflow: "hidden", animation: "scaleIn .25s cubic-bezier(.34,1.3,.64,1)", boxShadow: "0 40px 100px rgba(0,0,0,.8), 0 0 0 1px rgba(118,185,0,.08)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #76b900, #8fd100, transparent)" }} />
        <div style={{ padding: "28px 28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 2 }}>
                {mode === "login" ? "Bon retour 👋" : "Rejoindre GameDiary"}
              </h2>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>
                {mode === "login" ? "Connecte-toi pour accéder à ta collection" : "Crée ton compte gratuitement"}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(255,255,255,.04)", borderRadius: 11, padding: 4 }}>
            {[["login","Connexion"],["signup","Inscription"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{ flex: 1, background: mode===m ? "rgba(118,185,0,.14)" : "transparent", color: mode===m ? "#76ff47" : "rgba(255,255,255,.35)", border: mode===m ? "1px solid rgba(118,185,0,.3)" : "1px solid transparent", borderRadius: 8, padding: "8px", fontSize: 13, fontFamily: "'Syne',sans-serif", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <input className="input-field" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input className="input-field" type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            <input className="input-field" type="password" placeholder="Mot de passe (6 caractères min)" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>

          {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 12, padding: "10px 12px", background: "rgba(255,77,77,.08)", borderRadius: 8, border: "1px solid rgba(255,77,77,.15)" }}>{error}</div>}
          {success && <div style={{ color: "#76ff47", fontSize: 13, marginTop: 12, padding: "10px 12px", background: "rgba(118,255,71,.08)", borderRadius: 8, border: "1px solid rgba(118,255,71,.15)" }}>{success}</div>}

          {!success && (
            <button className="btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 18, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── GAME MODAL ─────────────────────────────────────────── */
const GameModal = ({ game, onClose, user, userRatings, setUserRatings, onAuthRequired }) => {
  const [myRating, setMyRating] = useState(userRatings[game.id]?.rating || 0);
  const [hovRating, setHovRating] = useState(0);
  const [comment, setComment] = useState(userRatings[game.id]?.comment || "");
  const [saved, setSaved] = useState(!!userRatings[game.id]);
  const [loading, setLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [bgErr, setBgErr] = useState(false);

  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const publish = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!myRating) return;
    setLoading(true);
    const { error } = await supabase.from("ratings").upsert(
      { user_id: user.id, game_id: game.id, rating: myRating, comment },
      { onConflict: "user_id,game_id" }
    );
    if (!error) {
      setUserRatings(p => ({ ...p, [game.id]: { rating: myRating, comment } }));
      setSaved(true);
    }
    setLoading(false);
  };

  const ratingColor = rc(myRating || hovRating);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.78)", backdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 780, maxHeight: "92vh", overflowY: "auto", borderRadius: 22, background: "rgba(10,11,12,.97)", border: "1px solid rgba(255,255,255,.07)", boxShadow: "0 40px 120px rgba(0,0,0,.9), 0 0 80px rgba(118,185,0,.04)", animation: "scaleIn .25s cubic-bezier(.34,1.3,.64,1)" }}>
        
        {/* Hero */}
        <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "22px 22px 0 0", flexShrink: 0 }}>
          {game.cover && !bgErr ? (
            <img src={game.cover} onError={() => setBgErr(true)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px) brightness(.45)", transform: "scale(1.1)" }} />
          ) : <div style={{ height: "100%", background: "linear-gradient(135deg, #0d1a00, #001108)" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 20%, rgba(10,11,12,.95) 85%, rgba(10,11,12,1) 100%)" }} />
          
          {/* Thumbnail */}
          <div style={{ position: "absolute", bottom: -32, left: 28, width: 96, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(118,185,0,.35)", boxShadow: "0 8px 28px rgba(0,0,0,.7)", flexShrink: 0 }}>
            <div style={{ paddingBottom: "140%", position: "relative", background: "#0a0b0c" }}>
              {game.cover && !imgErr
                ? <img src={game.cover} onError={() => setImgErr(true)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎮</div>
              }
            </div>
          </div>
          
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 99, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: "46px 28px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ background: "rgba(118,185,0,.14)", color: "#76ff47", border: "1px solid rgba(118,185,0,.28)", borderRadius: 99, padding: "3px 12px", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{game.platform.split("(")[0].trim()}</span>
                <span style={{ color: "rgba(255,255,255,.3)", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>{game.year}</span>
                {game.genre !== "Jeu vidéo" && <span style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>· {game.genre}</span>}
              </div>
              <h2 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", lineHeight: 1.15, marginBottom: 0 }}>{game.title}</h2>
            </div>
            <Ring value={game.rating} size={62} />
          </div>

          {/* Tags */}
          {game.tags.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
              {game.tags.map(t => <span key={t} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.38)", borderRadius: 7, padding: "4px 11px", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>#{t}</span>)}
            </div>
          )}

          {/* Summary */}
          {game.summary && (
            <p style={{ color: "rgba(255,255,255,.38)", fontSize: 14, lineHeight: 1.7, marginBottom: 22, fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}>
              {game.summary.length > 280 ? game.summary.slice(0, 280) + "…" : game.summary}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 1, marginBottom: 24, background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.05)", overflow: "hidden" }}>
            {[
              { val: game.rating || "—", label: "Score global", color: rc(game.rating) },
              { val: game.reviews > 0 ? game.reviews.toLocaleString() : "—", label: "Évaluations", color: "rgba(255,255,255,.7)" },
              { val: game.year, label: "Sortie", color: "rgba(255,255,255,.7)" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "14px 16px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rating section */}
          <div style={{ background: `rgba(118,185,0,.04)`, border: "1px solid rgba(118,185,0,.1)", borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(118,185,0,.65)", fontFamily: "'Syne',sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              {saved ? "✓  Critique publiée" : user ? "Votre évaluation" : "Connectez-vous pour noter"}
            </div>

            {!saved ? (
              <>
                <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                  {Array.from({ length: 10 }, (_, i) => {
                    const v = i + 1;
                    const on = v <= (hovRating || myRating);
                    const col = rc(v);
                    return (
                      <div key={v} onClick={() => user ? setMyRating(v) : onAuthRequired()}
                        onMouseEnter={() => setHovRating(v)} onMouseLeave={() => setHovRating(0)}
                        style={{ flex: 1, height: 38, borderRadius: 8, background: on ? `${col}1e` : "rgba(255,255,255,.04)", border: `1px solid ${on ? col + "66" : "rgba(255,255,255,.07)"}`, color: on ? col : "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: "'Syne',sans-serif", cursor: "pointer", transition: "all .12s", transform: hovRating === v ? "translateY(-3px)" : "none", boxShadow: on ? `0 0 10px ${col}33` : "none" }}>{v}</div>
                    );
                  })}
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={user ? "Partagez votre analyse du jeu..." : "Connectez-vous pour écrire une critique"}
                  disabled={!user}
                  style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 11, color: "rgba(255,255,255,.82)", padding: "12px 15px", fontSize: 14, resize: "vertical", minHeight: 88, outline: "none", transition: "border-color .18s", opacity: user ? 1 : .5, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={e => e.target.style.borderColor = "rgba(118,185,0,.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                />
                <button className="btn-primary" onClick={publish} disabled={loading || (!myRating && user)}
                  style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  {loading && <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />}
                  {loading ? "Publication..." : user ? `Publier${myRating ? ` — ${myRating}/10` : ""}` : "Se connecter pour publier"}
                </button>
              </>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {Array.from({ length: 10 }, (_, i) => {
                    const on = i < myRating;
                    const col = rc(myRating);
                    return <div key={i} style={{ flex: 1, height: 30, borderRadius: 6, background: on ? `${col}1e` : "rgba(255,255,255,.04)", border: `1px solid ${on ? col + "55" : "rgba(255,255,255,.06)"}`, color: on ? col : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</div>;
                  })}
                </div>
                {comment && <p style={{ color: "rgba(255,255,255,.48)", fontSize: 14, lineHeight: 1.65, borderLeft: "2px solid rgba(118,185,0,.35)", paddingLeft: 12, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{comment}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function GameDiary() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userRatings, setUserRatings] = useState({});

  // Home
  const [topGames, setTopGames] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

  // Explore
  const [searchQ, setSearchQ] = useState("");
  const [platFilter, setPlatFilter] = useState("Tous");
  const [exploreGames, setExploreGames] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const searchRef = useRef(null);

  // Discover
  const [activeTags, setActiveTags] = useState([]);
  const [discoGames, setDiscoGames] = useState([]);
  const [loadingDisco, setLoadingDisco] = useState(false);

  /* AUTH */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* LOAD USER RATINGS */
  useEffect(() => {
    if (!user) { setUserRatings({}); return; }
    supabase.from("ratings").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const r = {};
        data.forEach(d => r[d.game_id] = { rating: d.rating, comment: d.comment });
        setUserRatings(r);
      }
    });
  }, [user]);

  /* LOAD TOP GAMES (home) */
  useEffect(() => {
    const queries = POPULAR_QUERIES.slice(0, 3);
    Promise.all(queries.map(q => fetch(`/api/games?q=${q}`).then(r => r.json())))
      .then(results => {
        const all = results.flat().map(formatGame).filter(g => g.cover && g.rating);
        const unique = [...new Map(all.map(g => [g.id, g])).values()];
        const sorted = unique.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 9);
        setTopGames(sorted);
        setLoadingTop(false);
      })
      .catch(() => setLoadingTop(false));
  }, []);

  /* LOAD EXPLORE GAMES */
  const fetchExplore = useCallback(async (q) => {
    setLoadingExplore(true);
    const query = q.length >= 2 ? q : POPULAR_QUERIES[Math.floor(Math.random() * POPULAR_QUERIES.length)];
    try {
      const res = await fetch(`/api/games?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setExploreGames(data.map(formatGame).filter(g => g.cover));
    } catch {}
    setLoadingExplore(false);
  }, []);

  useEffect(() => {
    if (tab !== "explore") return;
    const timer = setTimeout(() => fetchExplore(searchQ), searchQ.length >= 2 ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchQ, tab]);

  useEffect(() => {
    if (tab === "explore" && exploreGames.length === 0) fetchExplore("");
  }, [tab]);

  /* DISCOVER */
  useEffect(() => {
    if (activeTags.length === 0) { setDiscoGames([]); return; }
    setLoadingDisco(true);
    const tag = activeTags[activeTags.length - 1];
    fetch(`/api/games?q=${encodeURIComponent(tag)}`)
      .then(r => r.json())
      .then(data => {
        setDiscoGames(data.map(formatGame).filter(g => g.cover && !userRatings[g.id]));
        setLoadingDisco(false);
      })
      .catch(() => setLoadingDisco(false));
  }, [activeTags]);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setUserRatings({}); };
  const ratedGames = topGames.filter(g => userRatings[g.id]).concat(
    exploreGames.filter(g => userRatings[g.id] && !topGames.find(t => t.id === g.id))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070809", color: "#e8eaed", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(118,185,0,.25), transparent)", pointerEvents: "none", zIndex: 200 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 55% 28% at 50% 0%, rgba(118,185,0,.055) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(7,8,9,.92)", backdropFilter: "blur(22px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 26 26">
            <polygon points="0,5 26,0 26,21 0,26" fill="#76b900" style={{ filter: "drop-shadow(0 0 7px #76b90099)" }} />
          </svg>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 1.5, color: "#f0f2f4", textTransform: "uppercase" }}>
            game<span style={{ color: "#76b900" }}>diary</span>
          </span>
        </div>

        <div className="nav-center" style={{ display: "flex", gap: 3, background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,.06)" }}>
          {[["home","Accueil"],["explore","Explorer"],["discover","Découvrir"],["profile","Profil"]].map(([id, label]) => (
            <button key={id} className={`nav-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,rgba(118,185,0,.18),rgba(118,185,0,.04))", border: "1px solid rgba(118,185,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#76b900", fontWeight: 800, fontSize: 12, fontFamily: "'Syne',sans-serif", cursor: "pointer" }} onClick={() => setTab("profile")}>
                {user.email?.slice(0, 2).toUpperCase()}
              </div>
              <button onClick={logout} className="hide-mobile" style={{ background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "rgba(255,255,255,.35)", cursor: "pointer", fontSize: 12, padding: "6px 12px", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,77,77,.4)"; e.currentTarget.style.color = "#ff6b6b"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(255,255,255,.35)"; }}>
                Déconnexion
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ padding: "8px 20px" }}>Connexion</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 }}>

        {/* ══ HOME ══ */}
        {tab === "home" && (
          <div>
            {/* Hero */}
            <div className="fade-up" style={{ padding: "68px 0 56px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.05)", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(118,185,0,.08)", border: "1px solid rgba(118,185,0,.18)", borderRadius: 99, padding: "5px 14px", marginBottom: 22 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#76b900", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 12, color: "rgba(118,185,0,.8)", fontWeight: 600, fontFamily: "'Syne',sans-serif", letterSpacing: .5 }}>Votre journal gaming</span>
                </div>
                <h1 className="hero-title" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(44px,5.5vw,74px)", lineHeight: .93, letterSpacing: "-2.5px", color: "#fff", marginBottom: 22 }}>
                  Notez<span style={{ color: "#76b900", textShadow: "0 0 50px rgba(118,185,0,.4)" }}>.</span><br />
                  Critiquez<span style={{ color: "rgba(255,255,255,.2)" }}>.</span><br />
                  Partagez<span style={{ color: "rgba(255,255,255,.08)" }}>.</span>
                </h1>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,.32)", maxWidth: 400, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif" }}>
                  De la Game Boy à la PS5. Des millions de jeux, une seule app pour cataloguer ton histoire gaming.
                </p>
                {!user && (
                  <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ marginTop: 28, padding: "12px 32px", fontSize: 15 }}>
                    Commencer gratuitement →
                  </button>
                )}
              </div>

              <div className="hide-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 }}>
                {[{n:"∞",l:"Jeux disponibles"},{n:"100%",l:"Gratuit"},{n:user?Object.keys(userRatings).length:"0",l:"Mes notes"},{n:"4.8★",l:"Note moyenne"}].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "18px 22px", minWidth: 130 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color: i === 0 || i === 2 ? "#76b900" : "rgba(255,255,255,.75)", lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)", marginTop: 5, fontFamily: "'DM Sans',sans-serif" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top games */}
            <div className="fade-up-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "rgba(255,255,255,.78)", letterSpacing: -.5 }}>Top jeux</h2>
                <button onClick={() => setTab("explore")} style={{ background: "none", border: "none", color: "rgba(118,185,0,.7)", cursor: "pointer", fontSize: 13, fontFamily: "'Syne',sans-serif", fontWeight: 700, transition: "color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#76b900"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(118,185,0,.7)"}>
                  Explorer tout →
                </button>
              </div>
              {loadingTop ? (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                  <div className="skeleton" style={{ height: 300, borderRadius: 18 }} />
                  <SkeletonCard /><SkeletonCard />
                </div>
              ) : topGames.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                  {topGames.slice(0, 3).map((g, i) =>
                    i === 0
                      ? <FeaturedCard key={g.id} game={g} onClick={setSelected} />
                      : <GameCard key={g.id} game={g} onClick={setSelected} rank={i + 1} />
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,.2)", fontFamily: "'Syne',sans-serif" }}>Impossible de charger les jeux.</div>
              )}
            </div>

            {/* More top */}
            {topGames.length > 3 && (
              <div className="fade-up-3" style={{ marginTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 12 }}>
                  {topGames.slice(3, 9).map((g, i) => <GameCard key={g.id} game={g} onClick={setSelected} rank={i + 4} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EXPLORE ══ */}
        {tab === "explore" && (
          <div className="fade-up" style={{ paddingTop: 44 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,.05)", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(118,185,0,.6)", fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 }}>Bibliothèque IGDB</div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: -1 }}>Explorer</h2>
              </div>

              <div style={{ position: "relative", flexShrink: 0 }}>
                <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Rechercher parmi des millions de jeux..."
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "rgba(255,255,255,.82)", padding: "11px 16px 11px 42px", fontSize: 14, width: 300, outline: "none", transition: "border-color .2s, background .2s" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(118,185,0,.4)"; e.target.style.background = "rgba(255,255,255,.06)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,.08)"; e.target.style.background = "rgba(255,255,255,.04)"; }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.25)", fontSize: 16 }}>⌕</span>
                {loadingExplore && <div className="spinner" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", overflowX: "auto", paddingBottom: 4 }}>
              {PLATFORMS_FILTER.map(p => (
                <button key={p} className={`plat-chip ${platFilter === p ? "active" : ""}`} onClick={() => setPlatFilter(p)}>{p}</button>
              ))}
            </div>

            {loadingExplore ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: 13 }}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : exploreGames.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,.2)", fontFamily: "'Syne',sans-serif" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
                <div style={{ fontSize: 16 }}>Aucun résultat pour "{searchQ}"</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: 13 }}>
                {exploreGames
                  .filter(g => platFilter === "Tous" || g.platform.toLowerCase().includes(platFilter.toLowerCase()))
                  .map(g => <GameCard key={g.id} game={g} onClick={setSelected} />)}
              </div>
            )}
          </div>
        )}

        {/* ══ DISCOVER ══ */}
        {tab === "discover" && (
          <div className="fade-up" style={{ paddingTop: 44 }}>
            <div style={{ paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,.05)", marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: "rgba(118,185,0,.6)", fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 }}>Recommandations IA</div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: -1, marginBottom: 10 }}>Découvrir</h2>
              <p style={{ color: "rgba(255,255,255,.28)", fontSize: 15, fontFamily: "'DM Sans',sans-serif" }}>Sélectionne tes univers — on cherche ton prochain jeu parfait parmi des millions de titres.</p>
            </div>

            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>Tes goûts</div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {ALL_TAGS_STATIC.map(t => {
                  const on = activeTags.includes(t);
                  return <button key={t} className={`tag-chip ${on ? "active" : ""}`} onClick={() => setActiveTags(p => on ? p.filter(x => x !== t) : [...p, t])}>#{t}</button>;
                })}
              </div>
            </div>

            {activeTags.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
                    {loadingDisco ? "Recherche..." : `${discoGames.length} jeux trouvés`}
                  </div>
                  {loadingDisco && <div className="spinner" />}
                </div>
                {!loadingDisco && discoGames.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: 13 }}>
                    {discoGames.map(g => <GameCard key={g.id} game={g} onClick={setSelected} />)}
                  </div>
                ) : !loadingDisco ? (
                  <div style={{ color: "rgba(255,255,255,.28)", fontSize: 15, borderLeft: "2px solid rgba(118,185,0,.35)", paddingLeft: 18, lineHeight: 1.7 }}>
                    Aucun jeu trouvé pour ces préférences. Essaie d'autres combinaisons !
                  </div>
                ) : null}
              </div>
            )}

            {activeTags.length === 0 && (
              <div style={{ textAlign: "center", padding: "70px 0", color: "rgba(255,255,255,.15)" }}>
                <div style={{ width: 70, height: 70, borderRadius: 18, background: "rgba(118,185,0,.05)", border: "1px solid rgba(118,185,0,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28 }}>◎</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600 }}>Choisis tes préférences pour commencer</div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab === "profile" && (
          <div className="fade-up" style={{ paddingTop: 44 }}>
            {!user ? (
              <div style={{ textAlign: "center", padding: "90px 0" }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(118,185,0,.06)", border: "1px solid rgba(118,185,0,.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", fontSize: 36 }}>👾</div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", marginBottom: 10 }}>Ton profil t'attend</h2>
                <p style={{ color: "rgba(255,255,255,.28)", marginBottom: 28, fontSize: 15 }}>Connecte-toi pour accéder à ta collection et sauvegarder tes notes</p>
                <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ fontSize: 15, padding: "13px 36px" }}>Se connecter</button>
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", padding: "36px 32px", marginBottom: 44 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #76b900, #8fd100 55%, transparent)" }} />
                  <div style={{ position: "absolute", top: 0, right: 0, width: 320, height: 320, background: "radial-gradient(circle, rgba(118,185,0,.055) 0%, transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,rgba(118,185,0,.18),rgba(118,185,0,.04))", border: "2px solid rgba(118,185,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>👾</div>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.22)", fontFamily: "'Syne',sans-serif", letterSpacing: 3, textTransform: "uppercase", marginBottom: 5 }}>Joueur</div>
                      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", marginBottom: 16, letterSpacing: -.5 }}>{user.email}</h2>
                      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                        {[
                          { v: Object.keys(userRatings).length, l: "Jeux notés" },
                          { v: Object.values(userRatings).filter(r => r.comment).length, l: "Critiques" },
                          { v: Object.keys(userRatings).length > 0 ? (Object.values(userRatings).reduce((a, b) => a + b.rating, 0) / Object.keys(userRatings).length).toFixed(1) : "—", l: "Note moyenne" },
                        ].map(s => (
                          <div key={s.l}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: "#76b900", lineHeight: 1 }}>{s.v}</div>
                            <div style={{ color: "rgba(255,255,255,.22)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection */}
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,.6)", marginBottom: 18, letterSpacing: -.3 }}>
                  Collection <span style={{ color: "rgba(255,255,255,.2)" }}>· {Object.keys(userRatings).length}</span>
                </h3>

                {Object.keys(userRatings).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,.15)", fontFamily: "'Syne',sans-serif" }}>
                    <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
                    <div style={{ fontSize: 15 }}>Aucun jeu noté pour l'instant</div>
                    <button onClick={() => setTab("explore")} style={{ marginTop: 16, background: "none", border: "1px solid rgba(118,185,0,.3)", borderRadius: 10, color: "#76b900", cursor: "pointer", fontSize: 13, padding: "8px 20px", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>Explorer les jeux →</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...topGames, ...exploreGames]
                      .filter((g, i, arr) => userRatings[g.id] && arr.findIndex(x => x.id === g.id) === i)
                      .map(g => {
                        const rv = userRatings[g.id];
                        return (
                          <div key={g.id} className="row-item" onClick={() => setSelected(g)} style={{ padding: "13px 18px", display: "flex", gap: 16, alignItems: "center" }}>
                            <div style={{ width: 44, height: 58, borderRadius: 7, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,.07)" }}>
                              {g.cover ? <img src={g.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.opacity = 0} />
                                : <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>🎮</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: "rgba(255,255,255,.85)", fontWeight: 600, fontSize: 15, fontFamily: "'Syne',sans-serif", marginBottom: 3, letterSpacing: -.2 }}>{g.title}</div>
                              <div style={{ color: "rgba(255,255,255,.25)", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>{g.platform.split("(")[0].trim()} · {g.year}</div>
                              {rv.comment && <div style={{ color: "rgba(255,255,255,.28)", fontSize: 13, marginTop: 5, fontStyle: "italic", fontFamily: "'DM Sans',sans-serif" }}>"{rv.comment.length > 80 ? rv.comment.slice(0, 80) + "…" : rv.comment}"</div>}
                            </div>
                            <Ring value={rv.rating} size={46} />
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selected && (
        <GameModal
          game={selected}
          onClose={() => setSelected(null)}
          user={user}
          userRatings={userRatings}
          setUserRatings={setUserRatings}
          onAuthRequired={() => { setSelected(null); setShowAuth(true); }}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={u => { setUser(u); setShowAuth(false); }} />}
    </div>
  );
}
