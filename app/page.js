"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const POPULAR_QUERIES = ["zelda","mario","elden ring","god of war","hades","cyberpunk","pokemon","sonic","final fantasy","resident evil"];
const PLATFORMS_FILTER = ["Tous","PS5","PS4","Nintendo Switch","PC","Xbox Series X","Mobile","Game Boy Advance"];
const ALL_TAGS = ["Open World","RPG","Action","Aventure","Platformer","Roguelike","Metroidvania","Souls-like","Simulation","Rétro","Difficile","Narratif","Multijoueur","Indie","Horreur","Sport","FPS","Puzzle"];

const STATUS_CONFIG = {
  wishlist:  { label: "Envie de jouer", icon: "📚", color: "#a78bfa" },
  playing:   { label: "En cours",       icon: "🎮", color: "#ff6b35" },
  completed: { label: "Terminé",        icon: "✅", color: "#ffd166" },
  dropped:   { label: "Abandonné",      icon: "❌", color: "#f87171" },
};

const formatRating = r => r ? Math.min(10, Math.round(r / 10)) : null;
const formatCover  = url => url ? `https:${url.replace("t_thumb","t_cover_big_2x")}` : null;
const formatYear   = ts  => ts  ? new Date(ts * 1000).getFullYear() : "—";
const formatGame   = g   => ({
  id:       g.id,
  title:    g.name || "Inconnu",
  platform: g.platforms?.[0]?.name || "Multi",
  year:     formatYear(g.first_release_date),
  genre:    g.genres?.[0]?.name || "Jeu vidéo",
  cover:    formatCover(g.cover?.url),
  rating:   formatRating(g.rating),
  reviews:  g.total_rating_count || 0,
  tags:     g.genres?.map(x => x.name).slice(0,4) || [],
  summary:  g.summary || "",
  videoId:  g.videos?.[0]?.video_id || null,
});

const rc = r => !r ? "rgba(255,255,255,.3)" : r >= 8 ? "#ffd166" : r >= 6 ? "#ff9a3c" : "#ff4d4d";

/* ── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#060709;color:#e2e4e9;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff6b35,#7a2800);border-radius:99px;}
  textarea,input,button{font-family:'Space Grotesk',sans-serif;}

  @keyframes fadeUp  {from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn  {from{opacity:0;}to{opacity:1;}}
  @keyframes scaleIn {from{opacity:0;transform:scale(.93);}to{opacity:1;transform:scale(1);}}
  @keyframes pulse   {0%,100%{opacity:.35;}50%{opacity:1;}}
  @keyframes spin    {to{transform:rotate(360deg);}}
  @keyframes shimmer {from{background-position:-700px 0;}to{background-position:700px 0;}}
  @keyframes slideUp {from{opacity:0;transform:translateY(44px);}to{opacity:1;transform:translateY(0);}}
  @keyframes shine   {from{left:-80%;}to{left:130%;}}
  @keyframes float   {0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes marquee {from{transform:translateX(0);}to{transform:translateX(-50%);}}
  @keyframes gradText{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

  .fu  {animation:fadeUp .55s cubic-bezier(.4,0,.2,1) both;}
  .fu2 {animation:fadeUp .55s .1s  cubic-bezier(.4,0,.2,1) both;}
  .fu3 {animation:fadeUp .55s .2s  cubic-bezier(.4,0,.2,1) both;}
  .fu4 {animation:fadeUp .55s .3s  cubic-bezier(.4,0,.2,1) both;}
  .fi  {animation:fadeIn .4s ease both;}

  /* ── Float wrappers for hero card stack ─────────────────── */
  .hf1{animation:float 5.2s ease-in-out infinite;}
  .hf2{animation:float 6.1s ease-in-out infinite .9s;}
  .hf3{animation:float 5.7s ease-in-out infinite 1.7s;}

  /* ── Cards ─────────────────────────────────────────── */
  .card{cursor:pointer;border-radius:16px;overflow:hidden;background:#0b0c10;border:1px solid rgba(255,255,255,.055);transition:transform .38s cubic-bezier(.34,1.4,.64,1),box-shadow .38s,border-color .28s;position:relative;}
  .card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 45%);opacity:0;transition:opacity .3s;z-index:1;pointer-events:none;border-radius:16px;}
  .card:hover{transform:translateY(-11px) scale(1.03);border-color:rgba(255,107,53,.38);box-shadow:0 36px 80px rgba(0,0,0,.65),0 0 0 1px rgba(255,107,53,.13),0 0 56px rgba(255,107,53,.06);}
  .card:hover::after{opacity:1;}
  .card img{transition:transform .65s cubic-bezier(.4,0,.2,1),filter .3s;}
  .card:hover img{transform:scale(1.08);filter:brightness(1.06) saturate(1.1);}
  .card-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 65% 65% at 50% 50%,rgba(0,0,0,.6) 0%,transparent 70%);opacity:0;transition:opacity .28s;z-index:2;}
  .card:hover .card-play{opacity:1;}
  .play-btn{width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.1);backdrop-filter:blur(14px);border:1.5px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:15px;transform:scale(.72);transition:transform .32s cubic-bezier(.34,1.4,.64,1),background .2s,border-color .2s;}
  .card:hover .play-btn{transform:scale(1);}
  .play-btn:hover{background:rgba(255,107,53,.22)!important;border-color:rgba(255,107,53,.55)!important;}

  .row{background:rgba(255,255,255,.022);border:1px solid rgba(255,255,255,.05);border-radius:14px;transition:background .2s,border-color .2s,transform .22s;cursor:pointer;}
  .row:hover{background:rgba(255,107,53,.05);border-color:rgba(255,107,53,.18);transform:translateX(4px);}

  /* ── Buttons ─────────────────────────────────────── */
  .btn{position:relative;overflow:hidden;background:linear-gradient(135deg,#ff6b35 0%,#ffd166 100%);color:#030401;border:none;border-radius:12px;padding:11px 26px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:transform .15s,box-shadow .22s;letter-spacing:.1px;box-shadow:0 4px 24px rgba(255,107,53,.28);}
  .btn::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.24),transparent);animation:shine 2.5s infinite;}
  .btn:hover{transform:translateY(-2px);box-shadow:0 10px 38px rgba(255,107,53,.4);}
  .btn:active{transform:translateY(0);}
  .btn:disabled{opacity:.38;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn:disabled::after{display:none;}
  .btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.35);cursor:pointer;border-radius:12px;padding:11px 22px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;transition:all .2s;display:inline-flex;align-items:center;}
  .btn-ghost:hover{border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.75);background:rgba(255,255,255,.04);}

  /* ── Inputs ──────────────────────────────────────── */
  .inp{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#e2e4e9;padding:12px 16px;font-size:14px;width:100%;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;}
  .inp:focus{border-color:rgba(255,107,53,.48);background:rgba(255,255,255,.055);box-shadow:0 0 0 3px rgba(255,107,53,.09);}
  .inp::placeholder{color:rgba(255,255,255,.18);}

  /* ── Skeleton ─────────────────────────────────────── */
  .skel{background:linear-gradient(90deg,#0d0e11 25%,#141619 50%,#0d0e11 75%);background-size:700px 100%;animation:shimmer 2s infinite;border-radius:10px;}

  /* ── Nav ─────────────────────────────────────────── */
  .nav-btn{background:transparent;border:none;padding:8px 16px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;cursor:pointer;transition:color .18s;color:rgba(255,255,255,.28);letter-spacing:.1px;position:relative;}
  .nav-btn::after{content:'';position:absolute;bottom:-1px;left:50%;right:50%;height:2px;background:linear-gradient(90deg,#ff6b35,#ffd166);border-radius:2px;transition:left .24s cubic-bezier(.4,0,.2,1),right .24s cubic-bezier(.4,0,.2,1),opacity .18s;opacity:0;}
  .nav-btn:hover{color:rgba(255,255,255,.6);}
  .nav-btn.active{color:#fff;}
  .nav-btn.active::after{left:16px;right:16px;opacity:1;}

  /* ── Chips & Tags ─────────────────────────────────── */
  .chip{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:99px;padding:5px 15px;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.26);white-space:nowrap;}
  .chip:hover{border-color:rgba(255,107,53,.36);color:#ff6b35;background:rgba(255,107,53,.05);}
  .chip.on{background:rgba(255,107,53,.1);border-color:rgba(255,107,53,.36);color:#ffb347;box-shadow:0 0 14px rgba(255,107,53,.1);}

  .tag{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);border-radius:10px;padding:9px 16px;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.25);}
  .tag:hover{background:rgba(255,107,53,.07);border-color:rgba(255,107,53,.28);color:#ff6b35;}
  .tag.on{background:rgba(255,107,53,.1);border-color:rgba(255,107,53,.36);color:#ffb347;box-shadow:0 0 18px rgba(255,107,53,.09),inset 0 1px 0 rgba(255,107,53,.12);}

  .spin{width:18px;height:18px;border:2px solid rgba(255,107,53,.12);border-top-color:#ff6b35;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

  .status-btn{border:none;border-radius:10px;padding:9px 17px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px;letter-spacing:.1px;}
  .status-btn:hover{transform:translateY(-1px);}

  /* ── Section headers ──────────────────────────────── */
  .section-label{font-size:10px;color:rgba(255,107,53,.55);font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:8px;}
  .section-title{font-family:'Syne',sans-serif;font-weight:800;font-size:34px;color:#fff;letter-spacing:-1.2px;line-height:1.02;}

  /* ── Gradient text ─────────────────────────────────── */
  .grad-text{background:linear-gradient(135deg,#fff 0%,#ff6b35 38%,#ffd166 72%,#ffe5a0 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradText 5s ease infinite;}

  /* ── Genre marquee tape ────────────────────────────── */
  .marquee-wrap{overflow:hidden;white-space:nowrap;}
  .marquee-track{display:inline-flex;gap:28px;animation:marquee 32s linear infinite;will-change:transform;}
  .marquee-wrap:hover .marquee-track{animation-play-state:paused;}

  /* ── Cinematic game page ──────────────────────────── */
  .cinematic-hero{position:relative;height:100vh;min-height:620px;overflow:hidden;display:flex;align-items:flex-end;}
  .cinematic-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.3) saturate(1.4);transform:scale(1.05);transition:transform 8s ease;}
  .cinematic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,7,9,1) 0%,rgba(6,7,9,.8) 35%,rgba(6,7,9,.1) 72%,transparent 100%);}
  .cinematic-overlay-2{position:absolute;inset:0;background:linear-gradient(to right,rgba(6,7,9,.9) 0%,rgba(6,7,9,.15) 60%,transparent 100%);}
  .yt-bg-wrap{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .yt-bg-wrap iframe{position:absolute;top:50%;left:50%;width:177.78vh;height:100vh;min-width:100%;min-height:56.25vw;transform:translate(-50%,-50%);border:none;opacity:.62;}

  /* ── Stat card ──────────────────────────────────── */
  .stat-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055);border-radius:16px;padding:20px 24px;min-width:120px;transition:all .26s;position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,53,.35),transparent);opacity:0;transition:opacity .26s;}
  .stat-card:hover{background:rgba(255,107,53,.04);border-color:rgba(255,107,53,.14);transform:translateY(-3px);}
  .stat-card:hover::before{opacity:1;}

  @media(max-width:768px){
    .hide-m{display:none!important;}
    .g2{grid-template-columns:repeat(2,1fr)!important;}
    .hero-t{font-size:38px!important;}
    .nav-center{gap:0!important;}
    .nav-btn{padding:8px 10px!important;font-size:12px!important;}
  }
`;

/* ── RING ──────────────────────────────────────────────────── */
const Ring = ({ value, size = 52 }) => {
  const color = rc(value);
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value ? (value / 10) * circ : 0;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={3} />
      {value && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 5px ${color}88)` }} />}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={value ? color : "rgba(255,255,255,.2)"}
        fontSize={size < 44 ? 10 : 12} fontWeight="800" fontFamily="'Syne',sans-serif">
        {value || "—"}
      </text>
    </svg>
  );
};

/* ── SKELETON ─────────────────────────────────────────────── */
const Skel = () => (
  <div style={{ borderRadius:14, overflow:"hidden", background:"#0c0d0f", border:"1px solid rgba(255,255,255,.05)" }}>
    <div className="skel" style={{ paddingBottom:"140%" }} />
    <div style={{ padding:"11px 13px 14px" }}>
      <div className="skel" style={{ height:13, width:"78%", marginBottom:6 }} />
      <div className="skel" style={{ height:10, width:"45%" }} />
    </div>
  </div>
);

/* ── GAME CARD ────────────────────────────────────────────── */
const GameCard = ({ game, onClick, rank }) => {
  const [e, setE] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)}>
      <div style={{ position:"relative", paddingBottom:"148%", background:"#09090d" }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(135deg,#0d0e12,#111318)" }}>
              <span style={{ fontSize:32 }}>🎮</span>
              <span style={{ color:"rgba(255,255,255,.15)", fontSize:10, textAlign:"center", padding:"0 10px", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.3 }}>{game.title}</span>
            </div>
        }

        {/* Rich bottom gradient */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,6,10,1) 0%,rgba(5,6,10,.7) 32%,rgba(5,6,10,.12) 58%,transparent 82%)" }} />

        {/* Hover play */}
        <div className="card-play">
          <div className="play-btn">{game.videoId ? "▶" : "+"}</div>
        </div>

        {/* Top-left badge */}
        {rank
          ? <div style={{ position:"absolute", top:10, left:10, background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:7, padding:"2px 9px", fontSize:10, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 2px 12px rgba(255,107,53,.4)" }}>#{rank}</div>
          : game.videoId && <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,.52)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"2px 8px", fontSize:9, color:"rgba(255,255,255,.6)", fontFamily:"'Space Grotesk',sans-serif", display:"flex", alignItems:"center", gap:3, letterSpacing:.4 }}>▶ trailer</div>
        }
        <div style={{ position:"absolute", top:8, right:8 }}><Ring value={game.rating} size={38} /></div>

        {/* Info overlaid at bottom — poster style */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 11px 13px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
            <span style={{ background:"rgba(255,255,255,.09)", borderRadius:5, padding:"1px 7px", fontSize:9, fontWeight:700, color:"rgba(255,255,255,.38)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.3 }}>
              {game.platform.length > 11 ? game.platform.slice(0,11)+"…" : game.platform}
            </span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.25)", fontFamily:"'DM Sans',sans-serif" }}>{game.year}</span>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.92)", fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.28, letterSpacing:"-.1px" }}>
            {game.title.length > 24 ? game.title.slice(0,24)+"…" : game.title}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── FEATURED CARD ────────────────────────────────────────── */
const FeaturedCard = ({ game, onClick }) => {
  const [e, setE] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)} style={{ borderRadius:20 }}>
      <div style={{ position:"relative", height:400 }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ height:"100%", background:"#111318", display:"flex", alignItems:"center", justifyContent:"center", fontSize:56 }}>🎮</div>}

        {/* Layered gradients for depth */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,6,10,1) 0%,rgba(5,6,10,.65) 38%,rgba(5,6,10,.08) 68%,transparent 100%)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(5,6,10,.38) 0%,transparent 55%)" }} />

        <div className="card-play">
          <div className="play-btn" style={{ width:60, height:60, fontSize:22 }}>{game.videoId ? "▶" : "+"}</div>
        </div>

        {/* Badges */}
        <div style={{ position:"absolute", top:14, left:14 }}>
          <span style={{ background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:9, padding:"4px 13px", fontSize:11, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 4px 18px rgba(255,107,53,.45)", letterSpacing:"-.1px" }}>#1</span>
        </div>
        <div style={{ position:"absolute", top:12, right:12 }}><Ring value={game.rating} size={54} /></div>

        {/* Content overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 20px 24px" }}>
          {game.tags.length > 0 && (
            <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
              {game.tags.slice(0,2).map(t => (
                <span key={t} style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.09)", color:"rgba(255,255,255,.45)", borderRadius:6, padding:"2px 9px", fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:.2 }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize:11, color:"rgba(255,255,255,.32)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:500, marginBottom:7, letterSpacing:.2 }}>
            {game.platform.split("(")[0].trim()} · {game.year}
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif", lineHeight:1.1, letterSpacing:"-.4px" }}>{game.title}</div>
        </div>
      </div>
    </div>
  );
};

/* ── AUTH MODAL ───────────────────────────────────────────── */
const AuthModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    if (!email || !pw) { setErr("Remplis tous les champs."); return; }
    if (pw.length < 6) { setErr("Mot de passe trop court (6 min)."); return; }
    setLoading(true); setErr(""); setOk("");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onSuccess(data.user); onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, username: username || email.split("@")[0] });
        setOk("Compte créé ! Vérifie ton email.");
      }
    } catch (e) {
      setErr(e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : e.message);
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.82)", backdropFilter:"blur(18px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:400, borderRadius:20, background:"rgba(10,11,12,.98)", border:"1px solid rgba(255,255,255,.08)", overflow:"hidden", animation:"scaleIn .25s cubic-bezier(.34,1.3,.64,1)", boxShadow:"0 40px 100px rgba(0,0,0,.85)" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#ff6b35,#ffd166,transparent)" }} />
        <div style={{ padding:"26px 26px 30px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, color:"#fff", marginBottom:3 }}>
                {mode === "login" ? "Bon retour 👋" : "Rejoindre GameDiary"}
              </h2>
              <p style={{ color:"rgba(255,255,255,.28)", fontSize:13 }}>
                {mode === "login" ? "Accède à ta collection" : "Gratuit, pour toujours"}
              </p>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.4)", cursor:"pointer" }}>✕</button>
          </div>

          <div style={{ display:"flex", gap:5, marginBottom:18, background:"rgba(255,255,255,.04)", borderRadius:10, padding:4 }}>
            {[["login","Connexion"],["signup","Inscription"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setErr(""); setOk(""); }}
                style={{ flex:1, background:mode===m?"rgba(255,107,53,.13)":"transparent", color:mode===m?"#ffd166":"rgba(255,255,255,.32)", border:mode===m?"1px solid rgba(255,107,53,.28)":"1px solid transparent", borderRadius:7, padding:"8px", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer", transition:"all .15s" }}>{l}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {mode === "signup" && <input className="inp" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />}
            <input className="inp" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
            <input className="inp" type="password" placeholder="Mot de passe (6 min)" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
          </div>

          {err && <div style={{ color:"#ff6b6b", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(255,77,77,.07)", borderRadius:8, border:"1px solid rgba(255,77,77,.14)" }}>{err}</div>}
          {ok  && <div style={{ color:"#ffd166", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(118,255,71,.07)", borderRadius:8, border:"1px solid rgba(118,255,71,.14)" }}>{ok}</div>}

          {!ok && <button className="btn" onClick={submit} disabled={loading} style={{ marginTop:16, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading && <div className="spin" style={{ width:15, height:15, borderWidth:2 }} />}
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>}
        </div>
      </div>
    </div>
  );
};

/* ── CINEMATIC GAME PAGE ──────────────────────────────────── */
const GamePage = ({ game, onClose, user, userRatings, setUserRatings, userStatus, setUserStatus, onAuthRequired }) => {
  const [myR, setMyR] = useState(userRatings[game.id]?.rating || 0);
  const [hovR, setHovR] = useState(0);
  const [txt, setTxt] = useState(userRatings[game.id]?.comment || "");
  const [saved, setSaved] = useState(!!userRatings[game.id]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(userStatus[game.id] || null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setBgLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = e => setScrolled(e.target.scrollTop > 80);

  const setStatus = async (status) => {
    if (!user) { onAuthRequired(); return; }
    setStatusLoading(true);
    const newStatus = currentStatus === status ? null : status;
    if (newStatus) {
      await supabase.from("game_status").upsert({
        user_id: user.id, game_id: game.id, status: newStatus,
        game_title: game.title, game_cover: game.cover,
        game_platform: game.platform, game_year: String(game.year),
      }, { onConflict: "user_id,game_id" });
    } else {
      await supabase.from("game_status").delete().eq("user_id", user.id).eq("game_id", game.id);
    }
    setCurrentStatus(newStatus);
    setUserStatus(p => ({ ...p, [game.id]: newStatus }));
    setStatusLoading(false);
  };

  const publish = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!myR) return;
    setLoading(true);
    const { error } = await supabase.from("ratings").upsert(
      { user_id:user.id, game_id:game.id, rating:myR, comment:txt },
      { onConflict:"user_id,game_id" }
    );
    if (!error) { setUserRatings(p => ({...p, [game.id]:{rating:myR, comment:txt}})); setSaved(true); }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"#060708", overflowY:"auto", animation:"fadeIn .3s" }} onScroll={handleScroll}>
      
      {/* Close button */}
      <button onClick={onClose} style={{ position:"fixed", top:20, left:20, zIndex:1001, background:"rgba(0,0,0,.65)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.12)", borderRadius:99, width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.7)", cursor:"pointer", fontSize:18, transition:"all .2s" }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,.1)"; e.currentTarget.style.color="#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,.65)"; e.currentTarget.style.color="rgba(255,255,255,.7)"; }}>
        ←
      </button>

      {/* Sticky mini header */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, height:62, display:"flex", alignItems:"center", padding:"0 80px", background: scrolled ? "rgba(6,7,8,.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,.05)" : "none", transition:"all .3s" }}>
        {scrolled && (
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {game.cover && <div style={{ width:32, height:42, borderRadius:5, overflow:"hidden" }}><img src={game.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>}
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>{game.title}</span>
          </div>
        )}
      </div>

      {/* Cinematic Hero */}
      <div className="cinematic-hero">
        {game.videoId ? (
          <>
            {game.cover && (
              <div className="cinematic-bg" style={{ backgroundImage:`url(${game.cover})`, transform:"scale(1)", filter:"brightness(.15) saturate(1.2)" }} />
            )}
            <div className="yt-bg-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${game.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${game.videoId}&playsinline=1&disablekb=1&modestbranding=1&rel=0`}
                allow="autoplay; encrypted-media"
              />
            </div>
          </>
        ) : (
          game.cover && (
            <div className="cinematic-bg" style={{ backgroundImage:`url(${game.cover})`, transform: bgLoaded ? "scale(1)" : "scale(1.08)", transition:"transform 1.2s ease, filter .8s ease", filter: bgLoaded ? "brightness(.35) saturate(1.3)" : "brightness(0) saturate(1)" }} />
          )
        )}
        <div className="cinematic-overlay" />
        <div className="cinematic-overlay-2" />

        <div style={{ position:"relative", zIndex:2, padding:"0 48px 56px", maxWidth:900, width:"100%", animation:"slideUp .6s .2s cubic-bezier(.4,0,.2,1) both" }}>
          {/* Badges */}
          <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ background:"rgba(255,107,53,.15)", color:"#ffd166", border:"1px solid rgba(255,107,53,.3)", borderRadius:99, padding:"4px 14px", fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
              {game.platform.split("(")[0].trim()}
            </span>
            <span style={{ color:"rgba(255,255,255,.4)", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{game.year}</span>
            {game.genre !== "Jeu vidéo" && <span style={{ color:"rgba(255,255,255,.4)", fontSize:13 }}>· {game.genre}</span>}
            {game.tags.slice(0,3).map(t => (
              <span key={t} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.45)", borderRadius:6, padding:"3px 10px", fontSize:11 }}>#{t}</span>
            ))}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(32px,5vw,68px)", lineHeight:.92, letterSpacing:"-2px", color:"#fff", marginBottom:20, textShadow:"0 2px 40px rgba(0,0,0,.8)" }}>
            {game.title}
          </h1>

          {/* Summary */}
          {game.summary && (
            <p style={{ fontSize:15, color:"rgba(255,255,255,.5)", maxWidth:560, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", marginBottom:28 }}>
              {game.summary.length > 240 ? game.summary.slice(0,240)+"…" : game.summary}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display:"flex", gap:28, marginBottom:32, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Ring value={game.rating} size={52} />
              <div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif" }}>Score global</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif" }}>{game.reviews > 0 ? game.reviews.toLocaleString()+" évals" : "Non noté"}</div>
              </div>
            </div>
            {userRatings[game.id] && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Ring value={userRatings[game.id].rating} size={52} />
                <div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"'DM Sans',sans-serif" }}>Ma note</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif" }}>Publiée</div>
                </div>
              </div>
            )}
          </div>

          {/* Status buttons */}
          <div style={{ display:"flex", gap:9, flexWrap:"wrap", alignItems:"center" }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const on = currentStatus === key;
              return (
                <button key={key} className="status-btn" onClick={() => setStatus(key)}
                  style={{ background: on ? `${cfg.color}22` : "rgba(255,255,255,.07)", color: on ? cfg.color : "rgba(255,255,255,.5)", border:`1px solid ${on ? cfg.color+"55" : "rgba(255,255,255,.12)"}`, boxShadow: on ? `0 0 14px ${cfg.color}33` : "none" }}>
                  <span>{cfg.icon}</span>
                  <span style={{ fontFamily:"'Syne',sans-serif" }}>{cfg.label}</span>
                  {statusLoading && on && <div className="spin" style={{ width:12, height:12, borderWidth:2 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content below hero */}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"52px 32px 80px" }}>

        {/* Rate section */}
        <div style={{ background:"rgba(255,107,53,.04)", border:"1px solid rgba(255,107,53,.1)", borderRadius:18, padding:"24px 26px", marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,107,53,.6)", fontFamily:"'Syne',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:16 }}>
            {saved ? "✓  Critique publiée" : user ? "Votre évaluation" : "Connectez-vous pour noter"}
          </div>

          {!saved ? (
            <>
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {Array.from({length:10}, (_,i) => {
                  const v=i+1, on=v<=(hovR||myR), col=rc(v);
                  return <div key={v} onClick={() => user ? setMyR(v) : onAuthRequired()}
                    onMouseEnter={() => setHovR(v)} onMouseLeave={() => setHovR(0)}
                    style={{ flex:1, height:40, borderRadius:8, background:on?`${col}1e`:"rgba(255,255,255,.04)", border:`1px solid ${on?col+"66":"rgba(255,255,255,.07)"}`, color:on?col:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif", cursor:"pointer", transition:"all .12s", transform:hovR===v?"translateY(-3px)":"none", boxShadow:on?`0 0 10px ${col}33`:"none" }}>{v}</div>;
                })}
              </div>
              <textarea value={txt} onChange={e => setTxt(e.target.value)}
                placeholder={user ? "Partagez votre analyse..." : "Connectez-vous pour écrire une critique"}
                disabled={!user}
                style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:11, color:"rgba(255,255,255,.8)", padding:"12px 15px", fontSize:14, resize:"vertical", minHeight:90, outline:"none", transition:"border-color .18s", lineHeight:1.6, opacity:user?1:.5 }}
                onFocus={e => e.target.style.borderColor="rgba(255,107,53,.4)"}
                onBlur={e => e.target.style.borderColor="rgba(255,255,255,.07)"}
              />
              <button className="btn" onClick={publish} disabled={loading||(!myR&&!!user)} style={{ marginTop:12, display:"flex", alignItems:"center", gap:8 }}>
                {loading && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                {loading ? "Publication..." : user ? `Publier${myR?` — ${myR}/10`:""}` : "Se connecter"}
              </button>
            </>
          ) : (
            <div>
              <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                {Array.from({length:10}, (_,i) => {
                  const on=i<myR, col=rc(myR);
                  return <div key={i} style={{ flex:1, height:30, borderRadius:6, background:on?`${col}1e`:"rgba(255,255,255,.04)", border:`1px solid ${on?col+"55":"rgba(255,255,255,.06)"}`, color:on?col:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>{i+1}</div>;
                })}
              </div>
              {txt && <p style={{ color:"rgba(255,255,255,.45)", fontSize:14, lineHeight:1.65, borderLeft:"2px solid rgba(255,107,53,.35)", paddingLeft:12, margin:0, fontStyle:"italic" }}>{txt}</p>}
            </div>
          )}
        </div>

        {/* Cover large */}
        {game.cover && (
          <div style={{ display:"flex", gap:32, alignItems:"flex-start", marginBottom:32 }}>
            <div style={{ width:180, flexShrink:0, borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)", boxShadow:"0 20px 60px rgba(0,0,0,.7)" }}>
              <div style={{ paddingBottom:"140%", position:"relative" }}>
                <img src={game.cover} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>
            <div style={{ flex:1, paddingTop:8 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", marginBottom:16 }}>Informations</div>
              {[
                { l:"Titre", v:game.title },
                { l:"Plateforme", v:game.platform.split("(")[0].trim() },
                { l:"Année", v:game.year },
                { l:"Genre", v:game.genre },
                { l:"Score communauté", v:game.rating ? `${game.rating}/10` : "Non noté" },
                { l:"Évaluations", v:game.reviews > 0 ? game.reviews.toLocaleString() : "—" },
              ].map(({ l, v }) => (
                <div key={l} style={{ display:"flex", gap:16, marginBottom:10, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.28)", fontFamily:"'DM Sans',sans-serif", width:140, flexShrink:0 }}>{l}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.72)", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function GameDiary() {
  const [tab, setTab]           = useState("home");
  const [selected, setSelected] = useState(null);
  const [user, setUser]         = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const [userStatus, setUserStatus]   = useState({});

  const [topGames, setTopGames]         = useState([]);
  const [loadingTop, setLoadingTop]     = useState(true);
  const [searchQ, setSearchQ]           = useState("");
  const [platFilter, setPlatFilter]     = useState("Tous");
  const [exploreGames, setExploreGames] = useState([]);
  const [loadingEx, setLoadingEx]       = useState(true);
  const [loadingMoreEx, setLoadingMoreEx] = useState(false);
  const [exploreOffset, setExploreOffset] = useState(0);
  const [hasMoreEx, setHasMoreEx]         = useState(true);
  const sentinelRef = useRef(null);
  const [activeTags, setActiveTags]     = useState([]);
  const [discoGames, setDiscoGames]     = useState([]);
  const [loadingDisco, setLoadingDisco] = useState(false);
  const [wishlistGames, setWishlistGames] = useState([]);

  /* Auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session?.user) setUser(data.session.user); });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_,s) => setUser(s?.user||null));
    return () => subscription.unsubscribe();
  }, []);

  /* Load ratings & status */
  useEffect(() => {
    if (!user) { setUserRatings({}); setUserStatus({}); setWishlistGames([]); return; }
    supabase.from("ratings").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) { const r={}; data.forEach(d => r[d.game_id]={rating:d.rating,comment:d.comment}); setUserRatings(r); }
    });
    supabase.from("game_status").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const s={};
        data.forEach(d => s[d.game_id]=d.status);
        setUserStatus(s);
        setWishlistGames(data.filter(d => d.status==="wishlist").map(d => ({
          id:d.game_id, title:d.game_title, cover:d.game_cover,
          platform:d.game_platform, year:d.game_year, genre:"Jeu vidéo", rating:null, reviews:0, tags:[], summary:"",
        })));
      }
    });
  }, [user]);

  /* Top games */
  useEffect(() => {
    Promise.all(POPULAR_QUERIES.slice(0,3).map(q => fetch(`/api/games?q=${q}`).then(r=>r.json())))
      .then(results => {
        const all = results.flat().map(formatGame).filter(g => g.cover && g.rating);
        const unique = [...new Map(all.map(g=>[g.id,g])).values()].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,9);
        setTopGames(unique); setLoadingTop(false);
      }).catch(()=>setLoadingTop(false));
  }, []);

  /* Explore */
  const fetchExplore = useCallback(async (q, offset = 0) => {
    if (offset === 0) { setLoadingEx(true); setExploreGames([]); setHasMoreEx(true); }
    else setLoadingMoreEx(true);
    try {
      const url = q.length >= 2
        ? `/api/games?q=${encodeURIComponent(q)}&offset=${offset}`
        : `/api/games?browse=1&offset=${offset}`;
      const data = await fetch(url).then(r=>r.json());
      const games = data.map(formatGame).filter(g=>g.cover);
      if (offset === 0) setExploreGames(games);
      else setExploreGames(prev => [...prev, ...games]);
      setHasMoreEx(games.length === 20);
    } catch {}
    setLoadingEx(false);
    setLoadingMoreEx(false);
  }, []);

  useEffect(() => {
    if (tab!=="explore") return;
    setExploreOffset(0);
    const t = setTimeout(()=>fetchExplore(searchQ, 0), searchQ.length>=2?500:0);
    return ()=>clearTimeout(t);
  }, [searchQ, tab]);

  useEffect(() => { if (tab==="explore"&&exploreGames.length===0) fetchExplore("", 0); }, [tab]);

  /* Infinite scroll sentinel */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreEx && !loadingEx && !loadingMoreEx) {
        const nextOffset = exploreOffset + 20;
        setExploreOffset(nextOffset);
        fetchExplore(searchQ, nextOffset);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMoreEx, loadingEx, loadingMoreEx, exploreOffset, searchQ]);

  /* Discover */
  useEffect(() => {
    if (activeTags.length===0) { setDiscoGames([]); return; }
    setLoadingDisco(true);
    fetch(`/api/games?q=${encodeURIComponent(activeTags[activeTags.length-1])}`)
      .then(r=>r.json())
      .then(data => { setDiscoGames(data.map(formatGame).filter(g=>g.cover&&!userRatings[g.id])); setLoadingDisco(false); })
      .catch(()=>setLoadingDisco(false));
  }, [activeTags]);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setUserRatings({}); setUserStatus({}); setWishlistGames([]); };

  const allRatedGames = [...topGames, ...exploreGames].filter((g,i,arr) => userRatings[g.id] && arr.findIndex(x=>x.id===g.id)===i);

  return (
    <div style={{ minHeight:"100vh", background:"#060708", color:"#e8eaed", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,107,53,.35),transparent)", pointerEvents:"none", zIndex:200 }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 60% 30% at 50% 0%,rgba(255,107,53,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 40% 40% at 80% 80%,rgba(200,80,20,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", opacity:.018, pointerEvents:"none" }} />

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", background:"rgba(5,6,10,.88)", backdropFilter:"blur(28px) saturate(200%)", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,107,53,.15),transparent)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#ff6b35,#7a2800)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px rgba(255,107,53,.3)" }}>
            <svg width="14" height="14" viewBox="0 0 26 26">
              <polygon points="0,5 26,0 26,21 0,26" fill="#fff" />
            </svg>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, letterSpacing:1.8, color:"#f0f2f4", textTransform:"uppercase" }}>
            game<span style={{ color:"#ff6b35", textShadow:"0 0 20px rgba(255,107,53,.5)" }}>diary</span>
          </span>
        </div>

        <div className="nav-center" style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,.06)", paddingBottom:1 }}>
          {[["home","Accueil"],["explore","Explorer"],["discover","Découvrir"],["profile","Profil"]].map(([id,label]) => (
            <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          {user ? (
            <>
              <div style={{ width:33, height:33, borderRadius:9, background:"linear-gradient(135deg,rgba(255,107,53,.17),rgba(255,107,53,.04))", border:"1px solid rgba(255,107,53,.26)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ff6b35", fontWeight:800, fontSize:12, fontFamily:"'Syne',sans-serif", cursor:"pointer" }} onClick={()=>setTab("profile")}>
                {user.email?.slice(0,2).toUpperCase()}
              </div>
              <button onClick={logout} className="hide-m" style={{ background:"none", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, color:"rgba(255,255,255,.32)", cursor:"pointer", fontSize:12, padding:"6px 11px", transition:"all .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,77,77,.35)";e.currentTarget.style.color="#ff6b6b";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.32)";}}>
                Déco
              </button>
            </>
          ) : (
            <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"8px 18px" }}>Connexion</button>
          )}
        </div>
      </nav>

      {/* ══ HOME HERO — full bleed ══ */}
      {tab==="home" && (
        <div style={{ position:"relative", minHeight:"92vh", display:"flex", overflow:"hidden" }}>
          {/* Blurred background from #1 game cover */}
          {!loadingTop && topGames[0]?.cover && (
            <div style={{ position:"absolute", inset:0, backgroundImage:`url(${topGames[0].cover})`, backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(.18) saturate(1.6) blur(28px)", transform:"scale(1.1)", zIndex:0 }} />
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(120deg,rgba(6,7,8,.98) 0%,rgba(6,7,8,.82) 40%,rgba(6,7,8,.35) 100%)", zIndex:1 }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,7,8,1) 0%,rgba(6,7,8,.3) 50%,transparent 100%)", zIndex:1 }} />

          {/* Left: text content */}
          <div style={{ position:"relative", zIndex:2, flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"80px 6% 100px", maxWidth:680 }}>
            <div className="fu" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.22)", borderRadius:99, padding:"6px 16px", marginBottom:30, width:"fit-content" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff6b35", animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:11, color:"rgba(255,107,53,.85)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:1.5, textTransform:"uppercase" }}>Votre journal gaming</span>
            </div>

            <h1 className="fu2" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(52px,6.8vw,96px)", lineHeight:.87, letterSpacing:"-3.5px", marginBottom:26 }}>
              <span className="grad-text">Notez</span><span style={{ color:"rgba(255,107,53,.5)" }}>.</span><br/>
              <span style={{ color:"rgba(255,255,255,.9)" }}>Critiquez</span><span style={{ color:"rgba(255,255,255,.1)" }}>.</span><br/>
              <span style={{ color:"rgba(255,255,255,.42)" }}>Partagez</span><span style={{ color:"rgba(255,255,255,.06)" }}>.</span>
            </h1>

            <p className="fu3" style={{ fontSize:16, color:"rgba(255,255,255,.32)", maxWidth:420, lineHeight:1.9, fontFamily:"'DM Sans',sans-serif", marginBottom:40 }}>
              Des millions de jeux, une seule app pour cataloguer ton histoire gaming. De la Game Boy à la PS5.
            </p>

            <div className="fu4" style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              {!user && <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"14px 34px", fontSize:15 }}>Commencer gratuitement →</button>}
              <button onClick={()=>setTab("explore")} style={{ background:"none", border:"1px solid rgba(255,255,255,.11)", borderRadius:11, color:"rgba(255,255,255,.38)", cursor:"pointer", fontSize:14, padding:"13px 22px", fontFamily:"'Syne',sans-serif", fontWeight:600, transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.28)";e.currentTarget.style.color="rgba(255,255,255,.75)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.11)";e.currentTarget.style.color="rgba(255,255,255,.38)";}}>
                Explorer les jeux
              </button>
            </div>

            <div style={{ display:"flex", gap:36, marginTop:56, paddingTop:32, borderTop:"1px solid rgba(255,255,255,.05)" }}>
              {[{n:"∞",l:"Jeux IGDB"},{n:"100%",l:"Gratuit"},{n:user?Object.keys(userRatings).length:"—",l:"Mes notes"},{n:user?Object.keys(userStatus).length:"—",l:"Ma liste"}].map((s,i)=>(
                <div key={i}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:i<2?"#ff6b35":"rgba(255,255,255,.75)", lineHeight:1, textShadow:i<2?"0 0 32px rgba(255,107,53,.45)":"none" }}>{s.n}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.22)", marginTop:6, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.5, fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stacked top 3 covers */}
          {!loadingTop && topGames.length>=3 && (
            <div className="hide-m fu" style={{ position:"relative", zIndex:2, flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 6% 100px 0" }}>
              <div style={{ position:"relative", width:340, height:460 }}>
                {/* #3 — back left, rotated + floating */}
                <div className="hf2" style={{ position:"absolute", top:30, left:0, zIndex:1 }}>
                  <div onClick={()=>setSelected(topGames[2])} style={{ width:185, borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,.09)", boxShadow:"0 28px 70px rgba(0,0,0,.75)", cursor:"pointer", transform:"rotate(-7deg)", transition:"transform .32s cubic-bezier(.34,1.4,.64,1)" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="rotate(-7deg) translateY(-10px) scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="rotate(-7deg)"}>
                    <div style={{ position:"relative", paddingBottom:"140%" }}>
                      <img src={topGames[2].cover} alt={topGames[2].title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 55%)" }} />
                      <div style={{ position:"absolute", bottom:11, left:11, right:11 }}>
                        <div style={{ fontSize:9, color:"#ffd166", fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:1.2, marginBottom:3 }}>#3</div>
                        <div style={{ fontSize:11, color:"#fff", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2 }}>{topGames[2].title.length>15?topGames[2].title.slice(0,15)+"…":topGames[2].title}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* #2 — back right, rotated + floating */}
                <div className="hf3" style={{ position:"absolute", top:10, right:0, zIndex:2 }}>
                  <div onClick={()=>setSelected(topGames[1])} style={{ width:190, borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,.09)", boxShadow:"0 28px 70px rgba(0,0,0,.75)", cursor:"pointer", transform:"rotate(6deg)", transition:"transform .32s cubic-bezier(.34,1.4,.64,1)" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="rotate(6deg) translateY(-10px) scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="rotate(6deg)"}>
                    <div style={{ position:"relative", paddingBottom:"140%" }}>
                      <img src={topGames[1].cover} alt={topGames[1].title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 55%)" }} />
                      <div style={{ position:"absolute", bottom:11, left:11, right:11 }}>
                        <div style={{ fontSize:9, color:"#ffd166", fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:1.2, marginBottom:3 }}>#2</div>
                        <div style={{ fontSize:11, color:"#fff", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2 }}>{topGames[1].title.length>15?topGames[1].title.slice(0,15)+"…":topGames[1].title}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* #1 — front center, upright + floating */}
                <div className="hf1" style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", zIndex:3 }}>
                  <div onClick={()=>setSelected(topGames[0])} style={{ width:210, borderRadius:18, overflow:"hidden", border:"1px solid rgba(255,107,53,.3)", boxShadow:"0 44px 96px rgba(0,0,0,.88),0 0 60px rgba(255,107,53,.12)", cursor:"pointer", transition:"transform .32s cubic-bezier(.34,1.4,.64,1)" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-13px) scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform=""}>
                    <div style={{ position:"relative", paddingBottom:"140%" }}>
                      <img src={topGames[0].cover} alt={topGames[0].title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%)" }} />
                      <div style={{ position:"absolute", top:11, left:11 }}>
                        <span style={{ background:"linear-gradient(135deg,#ff6b35,#ffd166)", color:"#030401", borderRadius:7, padding:"3px 10px", fontSize:10, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", boxShadow:"0 2px 14px rgba(255,107,53,.45)" }}>#1</span>
                      </div>
                      <div style={{ position:"absolute", top:9, right:9 }}><Ring value={topGames[0].rating} size={42} /></div>
                      <div style={{ position:"absolute", bottom:13, left:13, right:13 }}>
                        <div style={{ fontSize:14, color:"#fff", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.2, marginBottom:4, textShadow:"0 1px 12px rgba(0,0,0,.9)" }}>{topGames[0].title.length>18?topGames[0].title.slice(0,18)+"…":topGames[0].title}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,.38)", fontFamily:"'DM Sans',sans-serif" }}>{topGames[0].year} · {topGames[0].genre}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll hint */}
          <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:8, pointerEvents:"none" }}>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.18)", fontFamily:"'Syne',sans-serif", letterSpacing:2.5, textTransform:"uppercase" }}>Défiler</span>
            <div style={{ width:1, height:32, background:"linear-gradient(to bottom,rgba(255,107,53,.35),transparent)" }} />
          </div>
        </div>
      )}

      {/* ── Genre ticker strip ── */}
      {tab==="home" && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.04)", borderBottom:"1px solid rgba(255,255,255,.04)", padding:"13px 0", background:"rgba(255,255,255,.012)", overflow:"hidden" }}>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {["◆ Action","· RPG","◆ Open World","· Aventure","◆ Shooter","· Roguelike","◆ Platformer","· Souls-like","◆ Indie","· Stratégie","◆ Simulation","· Horreur","◆ Puzzle","· Sport","◆ Narratif","· Rétro","◆ Metroidvania","· FPS","◆ MOBA","· Multijoueur","◆ Action","· RPG","◆ Open World","· Aventure","◆ Shooter","· Roguelike","◆ Platformer","· Souls-like","◆ Indie","· Stratégie","◆ Simulation","· Horreur","◆ Puzzle","· Sport","◆ Narratif","· Rétro","◆ Metroidvania","· FPS","◆ MOBA","· Multijoueur"].map((g,i)=>(
                <span key={i} style={{ fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.2, textTransform:"uppercase", whiteSpace:"nowrap", color:g.startsWith("◆")?"rgba(255,107,53,.22)":"rgba(255,255,255,.07)" }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 22px 80px", position:"relative", zIndex:1 }}>

        {/* ══ HOME GRID ══ */}
        {tab==="home" && (
          <div style={{ paddingTop:56 }}>
            <div className="fu" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, color:"rgba(255,255,255,.75)", letterSpacing:-.5 }}>Top jeux</h2>
              <button onClick={()=>setTab("explore")} style={{ background:"none", border:"none", color:"rgba(255,107,53,.65)", cursor:"pointer", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Tout explorer →</button>
            </div>
            {loadingTop ? (
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:11 }}>
                <div className="skel" style={{ height:290, borderRadius:18 }} />
                <Skel /><Skel />
              </div>
            ) : topGames.length>0 ? (
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:11 }}>
                {topGames.slice(0,3).map((g,i)=> i===0 ? <FeaturedCard key={g.id} game={g} onClick={setSelected}/> : <GameCard key={g.id} game={g} onClick={setSelected} rank={i+1}/>)}
              </div>
            ) : <div style={{ textAlign:"center", padding:"50px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif" }}>Chargement impossible.</div>}

            {topGames.length>3 && (
              <div className="fu2" style={{ marginTop:11 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(152px,1fr))", gap:11 }}>
                  {topGames.slice(3,9).map((g,i)=><GameCard key={g.id} game={g} onClick={setSelected} rank={i+4}/>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EXPLORE ══ */}
        {tab==="explore" && (
          <div className="fu" style={{ paddingTop:42 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28, paddingBottom:24, borderBottom:"1px solid rgba(255,255,255,.04)", gap:16, flexWrap:"wrap" }}>
              <div>
                <div className="section-label">IGDB · Millions de jeux</div>
                <h2 className="section-title">Explorer</h2>
              </div>
              <div style={{ position:"relative", flexShrink:0 }}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="Rechercher un jeu..."
                  style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, color:"rgba(255,255,255,.85)", padding:"11px 16px 11px 42px", fontSize:14, width:290, outline:"none", transition:"all .2s", boxShadow:"0 2px 12px rgba(0,0,0,.3)" }}
                  onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.45)";e.target.style.background="rgba(255,255,255,.06)";e.target.style.boxShadow="0 0 0 3px rgba(255,107,53,.08)";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.08)";e.target.style.background="rgba(255,255,255,.04)";e.target.style.boxShadow="0 2px 12px rgba(0,0,0,.3)";}}
                />
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.2)", fontSize:16 }}>⌕</span>
                {loadingEx && <div className="spin" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }} />}
              </div>
            </div>

            <div style={{ display:"flex", gap:7, marginBottom:26, flexWrap:"wrap" }}>
              {PLATFORMS_FILTER.map(p=><button key={p} className={`chip ${platFilter===p?"on":""}`} onClick={()=>setPlatFilter(p)}>{p}</button>)}
            </div>

            {loadingEx ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                {Array.from({length:12}).map((_,i)=><Skel key={i}/>)}
              </div>
            ) : exploreGames.length===0 ? (
              <div style={{ textAlign:"center", padding:"70px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🔍</div>
                Aucun résultat pour "{searchQ}"
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                  {exploreGames.filter(g=>platFilter==="Tous"||g.platform.toLowerCase().includes(platFilter.toLowerCase())).map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
                </div>
                <div ref={sentinelRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center", marginTop:8 }}>
                  {loadingMoreEx && <div className="spin" />}
                  {!hasMoreEx && exploreGames.length>0 && <span style={{ color:"rgba(255,255,255,.15)", fontSize:12, fontFamily:"'Syne',sans-serif" }}>— Fin des résultats —</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ DISCOVER ══ */}
        {tab==="discover" && (
          <div className="fu" style={{ paddingTop:42 }}>
            <div style={{ paddingBottom:28, borderBottom:"1px solid rgba(255,255,255,.04)", marginBottom:38 }}>
              <div className="section-label">Recommandations</div>
              <h2 className="section-title" style={{ marginBottom:10 }}>Découvrir</h2>
              <p style={{ color:"rgba(255,255,255,.24)", fontSize:14, fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>Sélectionne tes univers — on trouve ton prochain jeu parmi des millions de titres.</p>
            </div>

            <div style={{ marginBottom:38 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", marginBottom:13 }}>Tes goûts</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ALL_TAGS.map(t=>{
                  const on=activeTags.includes(t);
                  return <button key={t} className={`tag ${on?"on":""}`} onClick={()=>setActiveTags(p=>on?p.filter(x=>x!==t):[...p,t])}>#{t}</button>;
                })}
              </div>
            </div>

            {activeTags.length>0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.18)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase" }}>
                    {loadingDisco?"Recherche…":`${discoGames.length} jeux`}
                  </div>
                  {loadingDisco && <div className="spin"/>}
                </div>
                {!loadingDisco && discoGames.length>0 ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                    {discoGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
                  </div>
                ) : !loadingDisco ? (
                  <div style={{ color:"rgba(255,255,255,.25)", fontSize:14, borderLeft:"2px solid rgba(255,107,53,.3)", paddingLeft:16 }}>Aucun résultat. Essaie d'autres préférences !</div>
                ) : null}
              </div>
            )}
            {activeTags.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.14)" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,107,53,.05)", border:"1px solid rgba(255,107,53,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26 }}>◎</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>Choisis tes goûts pour commencer</div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab==="profile" && (
          <div className="fu" style={{ paddingTop:42 }}>
            {!user ? (
              <div style={{ textAlign:"center", padding:"80px 0" }}>
                <div style={{ width:72, height:72, borderRadius:18, background:"rgba(255,107,53,.05)", border:"1px solid rgba(255,107,53,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>👾</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#fff", marginBottom:8 }}>Ton profil t'attend</h2>
                <p style={{ color:"rgba(255,255,255,.26)", marginBottom:24, fontSize:14 }}>Connecte-toi pour accéder à ta collection</p>
                <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"12px 32px", fontSize:15 }}>Se connecter</button>
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div style={{ position:"relative", borderRadius:20, overflow:"hidden", background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.06)", padding:"32px 28px", marginBottom:40 }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#ff6b35,#ffd166 55%,transparent)" }} />
                  <div style={{ position:"absolute", top:0, right:0, width:280, height:280, background:"radial-gradient(circle,rgba(255,107,53,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
                  <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ width:66, height:66, borderRadius:16, background:"linear-gradient(135deg,rgba(255,107,53,.17),rgba(255,107,53,.04))", border:"2px solid rgba(255,107,53,.26)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>👾</div>
                    <div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>Joueur</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#fff", marginBottom:14, letterSpacing:-.3 }}>{user.email}</h2>
                      <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
                        {[
                          { v:Object.keys(userRatings).length, l:"Notés" },
                          { v:Object.keys(userStatus).length, l:"Dans ma liste" },
                          { v:wishlistGames.length, l:"Envie de jouer" },
                          { v:Object.keys(userRatings).length>0?(Object.values(userRatings).reduce((a,b)=>a+b.rating,0)/Object.keys(userRatings).length).toFixed(1):"—", l:"Note moy." },
                        ].map(s=>(
                          <div key={s.l}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#ff6b35", lineHeight:1 }}>{s.v}</div>
                            <div style={{ color:"rgba(255,255,255,.2)", fontSize:11, fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wishlist */}
                {wishlistGames.length>0 && (
                  <div style={{ marginBottom:40 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.55)", marginBottom:16, letterSpacing:-.3 }}>
                      📚 Envie de jouer <span style={{ color:"rgba(255,255,255,.18)" }}>· {wishlistGames.length}</span>
                    </h3>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:11 }}>
                      {wishlistGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
                    </div>
                  </div>
                )}

                {/* Rated games */}
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.55)", marginBottom:16, letterSpacing:-.3 }}>
                  Collection <span style={{ color:"rgba(255,255,255,.18)" }}>· {Object.keys(userRatings).length}</span>
                </h3>

                {Object.keys(userRatings).length===0 ? (
                  <div style={{ textAlign:"center", padding:"50px 0", color:"rgba(255,255,255,.14)", fontFamily:"'Syne',sans-serif" }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
                    <div style={{ fontSize:14 }}>Aucun jeu noté</div>
                    <button onClick={()=>setTab("explore")} style={{ marginTop:14, background:"none", border:"1px solid rgba(255,107,53,.28)", borderRadius:9, color:"#ff6b35", cursor:"pointer", fontSize:13, padding:"7px 18px", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>Explorer →</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {allRatedGames.map(g=>{
                      const rv=userRatings[g.id];
                      const st=userStatus[g.id];
                      return (
                        <div key={g.id} className="row" onClick={()=>setSelected(g)} style={{ padding:"12px 16px", display:"flex", gap:14, alignItems:"center" }}>
                          <div style={{ width:40, height:52, borderRadius:7, overflow:"hidden", flexShrink:0, border:"1px solid rgba(255,255,255,.07)" }}>
                            {g.cover ? <img src={g.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.opacity=0}/> : <div style={{ width:"100%", height:"100%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ color:"rgba(255,255,255,.82)", fontWeight:600, fontSize:14, fontFamily:"'Syne',sans-serif", marginBottom:2 }}>{g.title}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ color:"rgba(255,255,255,.22)", fontSize:11 }}>{g.platform?.split("(")[0].trim()} · {g.year}</span>
                              {st && <span style={{ color:STATUS_CONFIG[st]?.color, fontSize:11, background:`${STATUS_CONFIG[st]?.color}18`, border:`1px solid ${STATUS_CONFIG[st]?.color}33`, borderRadius:4, padding:"1px 7px" }}>{STATUS_CONFIG[st]?.icon} {STATUS_CONFIG[st]?.label}</span>}
                            </div>
                            {rv.comment && <div style={{ color:"rgba(255,255,255,.24)", fontSize:12, marginTop:4, fontStyle:"italic" }}>"{rv.comment.length>70?rv.comment.slice(0,70)+"…":rv.comment}"</div>}
                          </div>
                          <Ring value={rv.rating} size={44}/>
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

      {/* Game page */}
      {selected && (
        <GamePage
          game={selected}
          onClose={()=>setSelected(null)}
          user={user}
          userRatings={userRatings}
          setUserRatings={setUserRatings}
          userStatus={userStatus}
          setUserStatus={setUserStatus}
          onAuthRequired={()=>{ setSelected(null); setShowAuth(true); }}
        />
      )}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={u=>{ setUser(u); setShowAuth(false); }}/>}
    </div>
  );
}
