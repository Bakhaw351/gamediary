"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const POPULAR_QUERIES = ["zelda","mario","elden ring","god of war","hades","cyberpunk","pokemon","sonic","final fantasy","resident evil"];
const PLATFORMS_FILTER = [
  "Tous",
  // Sony
  "PS5","PS4","PS3","PS2","PlayStation",
  // Microsoft
  "Xbox Series X","Xbox Series S","Xbox One","Xbox 360","Xbox",
  // Nintendo home
  "Nintendo Switch","Wii U","Wii","GameCube","Nintendo 64","Super Nintendo","NES",
  // Nintendo portables
  "Game Boy Advance","Game Boy Color","Game Boy","Nintendo DS","Nintendo 3DS","New Nintendo 3DS",
  // Sony portables
  "PSP","PS Vita",
  // PC / Cloud
  "PC","Steam Deck","Mac","Linux",
  // Mobile
  "iOS","Android",
  // Sega
  "Dreamcast","Sega Saturn","Sega Mega Drive","Sega Master System","Game Gear","Sega 32X",
  // Atari
  "Atari 2600","Atari 7800","Atari Jaguar","Atari Lynx",
  // Other
  "Neo Geo","TurboGrafx-16","3DO","Commodore 64","Amiga","Arcade",
];
const ALL_TAGS = ["Open World","RPG","Action","Aventure","Platformer","Roguelike","Metroidvania","Souls-like","Simulation","Rétro","Difficile","Narratif","Multijoueur","Indie","Horreur","Sport","FPS","Puzzle"];

const STATUS_CONFIG = {
  wishlist:  { label: "Envie de jouer", icon: "🔖", color: "#a78bfa" },
  playing:   { label: "En cours",       icon: "🎮", color: "#ff6b35" },
  completed: { label: "Terminé",        icon: "🏆", color: "#ffd166" },
  dropped:   { label: "Abandonné",      icon: "💀", color: "#f87171" },
};

const RATING_LABELS = {
  1:"Nul", 2:"Mauvais", 3:"Médiocre", 4:"Décevant",
  5:"Correct", 6:"Bien", 7:"Très bien", 8:"Excellent",
  9:"Chef-d'œuvre", 10:"Parfait ✦",
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

const PLATFORM_IDS = {
  "PS5":167,"PS4":48,"PS3":9,"PS2":8,"PlayStation":7,
  "Xbox Series X":169,"Xbox Series S":169,"Xbox One":49,"Xbox 360":12,"Xbox":11,
  "Nintendo Switch":130,"Nintendo Switch OLED":130,"Wii U":41,"Wii":5,"GameCube":21,
  "Nintendo 64":4,"Super Nintendo":19,"NES":18,
  "Game Boy Advance":24,"GBA SP":24,"Game Boy Color":22,"Game Boy":33,
  "Nintendo DS":20,"Nintendo 3DS":37,"New Nintendo 3DS":137,
  "PSP":38,"PS Vita":46,
  "PC":6,"Steam Deck":6,"Mac":14,"Linux":3,
  "iOS":39,"Android":34,
  "Dreamcast":23,"Sega Mega Drive":29,"Sega Saturn":32,
  "Sega Master System":35,"Sega Game Gear":35,"Sega 32X":30,
  "Atari 2600":59,"Atari 7800":60,"Atari Jaguar":62,"Atari Lynx":61,
  "Neo Geo":80,"TurboGrafx-16":86,"3DO":50,
  "Commodore 64":15,"Amiga":16,"Arcade":52,
};

/* ── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#060505;color:#e8e4e0;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff6b35,#7a2800);border-radius:99px;}
  textarea,input,button{font-family:'Space Grotesk',sans-serif;}

  @keyframes fadeUp   {from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn   {from{opacity:0;}to{opacity:1;}}
  @keyframes scaleIn  {from{opacity:0;transform:scale(.93);}to{opacity:1;transform:scale(1);}}
  @keyframes pulse    {0%,100%{opacity:.35;}50%{opacity:1;}}
  @keyframes spin     {to{transform:rotate(360deg);}}
  @keyframes shimmer  {from{background-position:-700px 0;}to{background-position:700px 0;}}
  @keyframes slideUp  {from{opacity:0;transform:translateY(44px);}to{opacity:1;transform:translateY(0);}}
  @keyframes shine    {from{left:-80%;}to{left:130%;}}
  @keyframes float    {0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes marquee  {from{transform:translateX(0);}to{transform:translateX(-50%);}}
  @keyframes marqueeR {from{transform:translateX(-50%);}to{transform:translateX(0);}}
  @keyframes gradText {0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes bounceY  {0%,100%{transform:translateX(-50%) translateY(0);}60%{transform:translateX(-50%) translateY(7px);}}
  @keyframes glowPulse{0%,100%{opacity:.5;}50%{opacity:1;}}
  @keyframes popIn    {from{transform:scale(0) rotate(-12deg);opacity:0;}to{transform:scale(1) rotate(0);opacity:1;}}
  @keyframes borderFlow{0%{background-position:0% 50%;}100%{background-position:200% 50%;}}

  .fu  {animation:fadeUp .55s cubic-bezier(.4,0,.2,1) both;}
  .fu2 {animation:fadeUp .55s .1s  cubic-bezier(.4,0,.2,1) both;}
  .fu3 {animation:fadeUp .55s .2s  cubic-bezier(.4,0,.2,1) both;}
  .fu4 {animation:fadeUp .55s .3s  cubic-bezier(.4,0,.2,1) both;}
  .fi  {animation:fadeIn .4s ease both;}

  /* ── Float wrappers ─────────────────────────────── */
  .hf1{animation:float 5.2s ease-in-out infinite;}
  .hf2{animation:float 6.1s ease-in-out infinite .9s;}
  .hf3{animation:float 5.7s ease-in-out infinite 1.7s;}

  /* ── Cards ──────────────────────────────────────── */
  .card{cursor:pointer;border-radius:16px;overflow:hidden;background:#0e0b0a;border:1px solid rgba(255,255,255,.055);transition:transform .38s cubic-bezier(.34,1.4,.64,1),box-shadow .38s,border-color .28s;position:relative;}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff6b35 35%,#ffd166 65%,transparent);opacity:0;transition:opacity .3s;z-index:4;}
  .card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 45%);opacity:0;transition:opacity .3s;z-index:1;pointer-events:none;border-radius:16px;}
  .card:hover{transform:translateY(-12px) scale(1.03);border-color:rgba(255,107,53,.32);box-shadow:0 40px 90px rgba(0,0,0,.72),0 0 0 1px rgba(255,107,53,.1),0 0 60px rgba(255,107,53,.07);}
  .card:hover::before,.card:hover::after{opacity:1;}
  .card img{transition:transform .65s cubic-bezier(.4,0,.2,1),filter .3s;}
  .card:hover img{transform:scale(1.08);filter:brightness(1.07) saturate(1.12);}
  .card-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 65% 65% at 50% 50%,rgba(0,0,0,.65) 0%,transparent 70%);opacity:0;transition:opacity .28s;z-index:2;}
  .card:hover .card-play{opacity:1;}
  .play-btn{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.08);backdrop-filter:blur(16px);border:1.5px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:15px;transform:scale(.7);transition:transform .32s cubic-bezier(.34,1.4,.64,1),background .2s,border-color .2s;}
  .card:hover .play-btn{transform:scale(1);}
  .play-btn:hover{background:rgba(255,107,53,.25)!important;border-color:rgba(255,107,53,.6)!important;}

  .row{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:14px;transition:background .22s,border-color .22s,transform .22s;cursor:pointer;}
  .row:hover{background:rgba(255,107,53,.05);border-color:rgba(255,107,53,.2);transform:translateX(5px);}

  /* ── Buttons ────────────────────────────────────── */
  .btn{position:relative;overflow:hidden;background:linear-gradient(135deg,#ff6b35 0%,#ff9a3c 50%,#ffd166 100%);background-size:200% 100%;color:#140800;border:none;border-radius:12px;padding:11px 26px;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:14px;cursor:pointer;transition:transform .15s,box-shadow .22s,background-position .4s;letter-spacing:.2px;box-shadow:0 4px 28px rgba(255,107,53,.32);}
  .btn::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:shine 2.8s infinite;}
  .btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px rgba(255,107,53,.48);background-position:100% 0;}
  .btn:active{transform:translateY(0);}
  .btn:disabled{opacity:.38;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn:disabled::after{display:none;}
  .btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.38);cursor:pointer;border-radius:12px;padding:11px 22px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;transition:all .2s;display:inline-flex;align-items:center;}
  .btn-ghost:hover{border-color:rgba(255,255,255,.28);color:rgba(255,255,255,.78);background:rgba(255,255,255,.04);}

  /* ── Inputs ─────────────────────────────────────── */
  .inp{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#e8e4e0;padding:12px 16px;font-size:14px;width:100%;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;}
  .inp:focus{border-color:rgba(255,107,53,.52);background:rgba(255,255,255,.05);box-shadow:0 0 0 3px rgba(255,107,53,.1);}
  .inp::placeholder{color:rgba(255,255,255,.18);}

  /* ── Skeleton ───────────────────────────────────── */
  .skel{background:linear-gradient(90deg,#100d0b 25%,#1c1510 50%,#100d0b 75%);background-size:700px 100%;animation:shimmer 2s infinite;border-radius:10px;}

  /* ── Nav ────────────────────────────────────────── */
  .nav-btn{background:transparent;border:none;padding:8px 18px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;cursor:pointer;transition:color .18s;color:rgba(255,255,255,.3);letter-spacing:.1px;position:relative;}
  .nav-btn::after{content:'';position:absolute;bottom:-2px;left:50%;right:50%;height:2px;background:linear-gradient(90deg,#ff6b35,#ffd166);border-radius:2px;transition:left .26s cubic-bezier(.4,0,.2,1),right .26s cubic-bezier(.4,0,.2,1),opacity .18s;opacity:0;}
  .nav-btn:hover{color:rgba(255,255,255,.65);}
  .nav-btn.active{color:#fff;}
  .nav-btn.active::after{left:18px;right:18px;opacity:1;}

  /* ── Chips & Tags ───────────────────────────────── */
  .chip{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:99px;padding:5px 16px;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .2s;color:rgba(255,255,255,.28);white-space:nowrap;}
  .chip:hover{border-color:rgba(255,107,53,.38);color:#ff6b35;background:rgba(255,107,53,.06);}
  .chip.on{background:linear-gradient(135deg,rgba(255,107,53,.14),rgba(255,209,102,.08));border-color:rgba(255,107,53,.42);color:#ffd166;box-shadow:0 0 18px rgba(255,107,53,.14);}

  .tag{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.065);border-radius:11px;padding:10px 18px;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;cursor:pointer;transition:all .2s;color:rgba(255,255,255,.28);position:relative;overflow:hidden;}
  .tag::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,107,53,.08),rgba(255,209,102,.04));opacity:0;transition:opacity .2s;}
  .tag:hover{border-color:rgba(255,107,53,.3);color:#ff9a3c;transform:translateY(-1px);}
  .tag:hover::after{opacity:1;}
  .tag.on{background:linear-gradient(135deg,rgba(255,107,53,.12),rgba(255,209,102,.07));border-color:rgba(255,107,53,.42);color:#ffd166;box-shadow:0 4px 22px rgba(255,107,53,.1),inset 0 1px 0 rgba(255,255,255,.07);}
  .tag.on::after{opacity:1;}

  .spin{width:18px;height:18px;border:2px solid rgba(255,107,53,.15);border-top-color:#ff6b35;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

  .status-btn{border:none;border-radius:11px;padding:9px 17px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .22s;display:flex;align-items:center;gap:6px;letter-spacing:.1px;}
  .status-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3);}

  /* ── Section headers ────────────────────────────── */
  .section-label{font-size:10px;color:rgba(255,107,53,.6);font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:8px;}
  .section-title{font-family:'Syne',sans-serif;font-weight:800;font-size:34px;color:#fff;letter-spacing:-1.2px;line-height:1.02;}

  /* ── Sect-h : section with vertical ember bar ───── */
  .sect-h{display:flex;align-items:center;gap:13px;}
  .sect-h::before{content:'';width:3px;height:22px;background:linear-gradient(to bottom,#ff6b35,#ffd166);border-radius:99px;flex-shrink:0;box-shadow:0 0 10px rgba(255,107,53,.5);}

  /* ── Gradient text ──────────────────────────────── */
  .grad-text{background:linear-gradient(135deg,#fff 0%,#ff6b35 38%,#ffd166 72%,#ffe5a0 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradText 5s ease infinite;}

  /* ── Genre marquee tape ─────────────────────────── */
  .marquee-wrap{overflow:hidden;white-space:nowrap;}
  .marquee-track{display:inline-flex;gap:28px;animation:marquee 80s linear infinite;will-change:transform;}
  .marquee-track-r{display:inline-flex;gap:28px;animation:marqueeR 95s linear infinite;will-change:transform;}
  .marquee-wrap:hover .marquee-track,.marquee-wrap:hover .marquee-track-r{animation-play-state:paused;}

  /* ── Cinematic game page ────────────────────────── */
  .cinematic-hero{position:relative;height:100vh;min-height:620px;overflow:hidden;display:flex;align-items:flex-end;}
  .cinematic-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.28) saturate(1.5);transform:scale(1.05);transition:transform 8s ease;}
  .cinematic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,5,5,1) 0%,rgba(6,5,5,.82) 35%,rgba(6,5,5,.08) 72%,transparent 100%);}
  .cinematic-overlay-2{position:absolute;inset:0;background:linear-gradient(to right,rgba(6,5,5,.92) 0%,rgba(6,5,5,.12) 60%,transparent 100%);}
  .yt-bg-wrap{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .yt-bg-wrap iframe{position:absolute;top:50%;left:50%;width:177.78vh;height:100vh;min-width:100%;min-height:56.25vw;transform:translate(-50%,-50%);border:none;opacity:.62;}

  /* ── Stat card ──────────────────────────────────── */
  .stat-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055);border-radius:16px;padding:20px 24px;min-width:120px;transition:all .26s;position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,53,.4),transparent);opacity:0;transition:opacity .26s;}
  .stat-card:hover{background:rgba(255,107,53,.04);border-color:rgba(255,107,53,.15);transform:translateY(-3px);}
  .stat-card:hover::before{opacity:1;}

  /* ── Hero stat mini cards ───────────────────────── */
  .stat-mini{background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px 20px;text-align:center;transition:all .24s;cursor:default;}
  .stat-mini:hover{background:rgba(255,107,53,.06);border-color:rgba(255,107,53,.2);transform:translateY(-2px);}

  /* ── Profile banner ─────────────────────────────── */
  .profile-banner{position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,rgba(255,107,53,.08) 0%,rgba(255,209,102,.04) 50%,rgba(167,139,250,.04) 100%);border:1px solid rgba(255,255,255,.07);padding:32px 28px 28px;}
  .profile-banner::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff6b35,#ffd166 55%,#a78bfa);}

  /* ── Scroll bounce ──────────────────────────────── */
  .bounce{animation:bounceY 2s ease-in-out infinite;}

  /* ── Glass panel ────────────────────────────────── */
  .glass-panel{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:20px;backdrop-filter:blur(12px);}

  /* ── gp-grid ────────────────────────────────────── */
  .gp-grid{display:grid;grid-template-columns:260px 1fr;gap:32px;align-items:start;}

  @media(max-width:900px){.gp-grid{grid-template-columns:1fr!important;}}
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
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:420, borderRadius:22, background:"rgba(9,7,7,.98)", border:"1px solid rgba(255,255,255,.07)", overflow:"hidden", animation:"scaleIn .28s cubic-bezier(.34,1.3,.64,1)", boxShadow:"0 60px 120px rgba(0,0,0,.9), 0 0 80px rgba(255,107,53,.06)" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#ff6b35 0%,#ffd166 55%,#a78bfa 100%)" }} />
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
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(true);

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
                key={muted}
                src={`https://www.youtube.com/embed/${game.videoId}?autoplay=1&mute=${muted?1:0}&controls=0&loop=1&playlist=${game.videoId}&playsinline=1&disablekb=1&modestbranding=1&rel=0`}
                allow="autoplay; encrypted-media"
              />
            </div>
            {/* Mute toggle */}
            <button onClick={()=>setMuted(m=>!m)} style={{ position:"absolute", bottom:28, right:28, zIndex:10, width:38, height:38, borderRadius:"50%", background:"rgba(0,0,0,.45)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.75)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, transition:"all .2s" }}
              title={muted?"Activer le son":"Couper le son"}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.25)";e.currentTarget.style.borderColor="rgba(255,107,53,.5)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,.45)";e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.75)";}}>
              {muted ? "🔇" : "🔊"}
            </button>
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
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"52px 32px 100px" }}>
        <div className="gp-grid" style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:32, alignItems:"start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div>
            {/* Cover with ember glow */}
            {game.cover && (
              <div style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(255,255,255,.09)", boxShadow:"0 40px 90px rgba(0,0,0,.85), 0 0 70px rgba(255,107,53,.1)", marginBottom:20 }}>
                <div style={{ paddingBottom:"140%", position:"relative" }}>
                  <img src={game.cover} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              </div>
            )}

            {/* Score duo */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              <div style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.22)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Communauté</div>
                <Ring value={game.rating} size={52} />
                <div style={{ fontSize:10, color:"rgba(255,255,255,.22)", fontFamily:"'DM Sans',sans-serif", marginTop:8 }}>
                  {game.reviews > 0 ? game.reviews.toLocaleString() : "Non noté"}
                </div>
              </div>
              <div style={{ background: myR ? "rgba(255,107,53,.06)" : "rgba(255,255,255,.025)", border:`1px solid ${myR ? "rgba(255,107,53,.22)" : "rgba(255,255,255,.06)"}`, borderRadius:14, padding:"14px 10px", textAlign:"center", transition:"all .3s" }}>
                <div style={{ fontSize:9, color: myR ? "rgba(255,107,53,.7)" : "rgba(255,255,255,.22)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Ma note</div>
                <Ring value={myR || null} size={52} />
                <div style={{ fontSize:10, color:"rgba(255,255,255,.22)", fontFamily:"'DM Sans',sans-serif", marginTop:8 }}>
                  {myR ? RATING_LABELS[myR] : "—"}
                </div>
              </div>
            </div>

            {/* Status buttons — vertical */}
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const on = currentStatus === key;
                return (
                  <button key={key} className="status-btn" onClick={() => setStatus(key)}
                    style={{ width:"100%", justifyContent:"flex-start", background: on ? `${cfg.color}18` : "rgba(255,255,255,.04)", color: on ? cfg.color : "rgba(255,255,255,.38)", border:`1px solid ${on ? cfg.color+"44" : "rgba(255,255,255,.07)"}`, boxShadow: on ? `0 0 18px ${cfg.color}22` : "none", padding:"10px 14px", borderRadius:12, fontSize:13 }}>
                    <span style={{ fontSize:15, marginRight:8 }}>{cfg.icon}</span>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{cfg.label}</span>
                    {statusLoading && on && <div className="spin" style={{ width:12, height:12, borderWidth:2, marginLeft:"auto" }} />}
                    {on && !statusLoading && <span style={{ marginLeft:"auto", fontSize:10, opacity:.6 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT MAIN ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* ── RATING CARD ── */}
            <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, overflow:"hidden" }}>
              {/* Card top accent */}
              <div style={{ height:2, background: saved ? `linear-gradient(90deg,${rc(myR)},${rc(myR)}88,transparent)` : "linear-gradient(90deg,rgba(255,255,255,.06),transparent)" }} />
              <div style={{ padding:"24px 26px 26px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div style={{ fontSize:10, color:"rgba(255,107,53,.65)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>
                    {saved ? "Critique publiée" : user ? "Ma critique" : "Notez ce jeu"}
                  </div>
                  {saved && (
                    <button onClick={() => setSaved(false)} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)", borderRadius:8, color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:11, padding:"5px 12px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,53,.35)";e.currentTarget.style.color="#ff6b35";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.09)";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
                      Modifier
                    </button>
                  )}
                </div>

                {!saved ? (
                  <>
                    {/* Big number preview */}
                    <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:22 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:80, fontWeight:800, lineHeight:1, color: (hovR||myR) ? rc(hovR||myR) : "rgba(255,255,255,.07)", transition:"color .12s", filter:(hovR||myR) ? `drop-shadow(0 0 28px ${rc(hovR||myR)}66)` : "none" }}>
                        {hovR || myR || "?"}
                      </div>
                      <div style={{ paddingBottom:12 }}>
                        <div style={{ fontSize:18, color:"rgba(255,255,255,.12)", fontFamily:"'Syne',sans-serif", fontWeight:700, lineHeight:1, marginBottom:5 }}>/10</div>
                        <div style={{ fontSize:14, color:(hovR||myR) ? rc(hovR||myR) : "rgba(255,255,255,.18)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"color .12s", minWidth:120 }}>
                          {RATING_LABELS[hovR||myR] || "Choisissez"}
                        </div>
                      </div>
                    </div>

                    {/* Equalizer bars */}
                    <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:76, marginBottom:22, padding:"0 2px" }}>
                      {Array.from({length:10},(_,i) => {
                        const v=i+1, on=v<=(hovR||myR), col=rc(v);
                        const barH = Math.round(12 + (v/10)*88);
                        return (
                          <div key={v}
                            onClick={() => user ? setMyR(v) : onAuthRequired()}
                            onMouseEnter={() => setHovR(v)}
                            onMouseLeave={() => setHovR(0)}
                            title={`${v} — ${RATING_LABELS[v]}`}
                            style={{ flex:1, height:`${barH}%`, borderRadius:"4px 4px 0 0", background: on ? `linear-gradient(to top,${col},${col}bb)` : "rgba(255,255,255,.06)", cursor:"pointer", transition:"all .18s cubic-bezier(.34,1.4,.64,1)", transform:hovR===v?"scaleY(1.1)":"scaleY(1)", transformOrigin:"bottom", boxShadow:on?`0 -4px 16px ${col}44`:"none" }}
                          />
                        );
                      })}
                    </div>

                    {/* Number labels under bars */}
                    <div style={{ display:"flex", gap:5, marginBottom:20, padding:"0 2px" }}>
                      {Array.from({length:10},(_,i) => {
                        const v=i+1, on=v<=(hovR||myR);
                        return <div key={v} style={{ flex:1, textAlign:"center", fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color: on ? rc(v) : "rgba(255,255,255,.14)", transition:"color .12s" }}>{v}</div>;
                      })}
                    </div>

                    {/* Textarea */}
                    <textarea value={txt} onChange={e => setTxt(e.target.value.slice(0,500))}
                      placeholder={user ? "Partagez votre ressenti, vos points forts, ce qui vous a marqué…" : "Connectez-vous pour écrire une critique"}
                      disabled={!user}
                      rows={4}
                      style={{ width:"100%", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, color:"rgba(255,255,255,.8)", padding:"14px 16px", fontSize:14, resize:"none", outline:"none", transition:"border-color .18s, background .18s", lineHeight:1.65, fontFamily:"'DM Sans',sans-serif", opacity:user?1:.45 }}
                      onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.4)";e.target.style.background="rgba(255,255,255,.045)";}}
                      onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.07)";e.target.style.background="rgba(255,255,255,.03)";}}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.16)", fontFamily:"'Space Grotesk',sans-serif" }}>{txt.length}/500</span>
                      <button className="btn" onClick={publish} disabled={loading||(!myR&&!!user)} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 28px" }}>
                        {loading && <div className="spin" style={{ width:14, height:14, borderWidth:2 }} />}
                        {loading ? "Publication…" : user ? `Publier${myR ? ` · ${myR}/10` : ""}` : "Se connecter"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── Review card ── */
                  <div style={{ animation:"fadeIn .3s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20, padding:"18px 20px", background:`linear-gradient(135deg,${rc(myR)}0e,${rc(myR)}06)`, border:`1px solid ${rc(myR)}28`, borderRadius:14 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:64, fontWeight:800, lineHeight:1, color:rc(myR), filter:`drop-shadow(0 0 22px ${rc(myR)}55)`, flexShrink:0 }}>{myR}</div>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{RATING_LABELS[myR]}</div>
                        <div style={{ display:"flex", gap:4 }}>
                          {Array.from({length:10},(_,i) => (
                            <div key={i} style={{ width:20, height:4, borderRadius:2, background: i<myR ? rc(myR) : "rgba(255,255,255,.08)", transition:"background .2s" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {txt && (
                      <blockquote style={{ margin:0, padding:"16px 20px 16px 20px", borderLeft:`3px solid ${rc(myR)}55`, background:"rgba(255,255,255,.02)", borderRadius:"0 12px 12px 0" }}>
                        <p style={{ color:"rgba(255,255,255,.55)", fontSize:14, lineHeight:1.75, fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", margin:0 }}>"{txt}"</p>
                      </blockquote>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── SYNOPSIS ── */}
            {game.summary && (
              <div style={{ background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"22px 26px" }}>
                <div style={{ fontSize:10, color:"rgba(255,107,53,.65)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>Synopsis</div>
                <p style={{ color:"rgba(255,255,255,.52)", fontSize:14, lineHeight:1.85, fontFamily:"'DM Sans',sans-serif", margin:0 }}>
                  {expanded || game.summary.length <= 300 ? game.summary : game.summary.slice(0,300)+"…"}
                </p>
                {game.summary.length > 300 && (
                  <button onClick={() => setExpanded(!expanded)} style={{ background:"none", border:"none", color:"rgba(255,107,53,.7)", cursor:"pointer", fontSize:13, padding:"10px 0 0", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
                    {expanded ? "Réduire ↑" : "Lire la suite ↓"}
                  </button>
                )}
              </div>
            )}

            {/* ── INFO GRID ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {[
                { icon:"🖥", label:"Plateforme", value:game.platform.split("(")[0].trim() },
                { icon:"📅", label:"Année de sortie", value:game.year },
                { icon:"🎭", label:"Genre principal", value:game.genre },
                { icon:"👥", label:"Évaluations IGDB", value:game.reviews > 0 ? game.reviews.toLocaleString() : "—" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="stat-card" style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,.78)", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            {game.tags.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {game.tags.map(t => (
                  <span key={t} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.38)", borderRadius:8, padding:"6px 14px", fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, letterSpacing:.3 }}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
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
  const platScrollRef = useRef(null);
  const scrollPlat = dir => platScrollRef.current?.scrollBy({ left: dir * 220, behavior:"smooth" });
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
  const fetchExplore = useCallback(async (q, plat, offset = 0) => {
    if (offset === 0) { setLoadingEx(true); setExploreGames([]); setHasMoreEx(true); }
    else setLoadingMoreEx(true);
    try {
      const platId = plat && plat !== "Tous" ? PLATFORM_IDS[plat] : null;
      const platParam = platId ? `&platform=${platId}` : "";
      const url = q.length >= 2
        ? `/api/games?q=${encodeURIComponent(q)}&offset=${offset}${platParam}`
        : `/api/games?offset=${offset}${platParam}`;
      const data = await fetch(url).then(r=>r.json());
      const games = (Array.isArray(data) ? data : []).map(formatGame).filter(g=>g.cover);
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
    const t = setTimeout(()=>fetchExplore(searchQ, platFilter, 0), searchQ.length>=2?500:0);
    return ()=>clearTimeout(t);
  }, [searchQ, platFilter, tab]);

  useEffect(() => { if (tab==="explore"&&exploreGames.length===0) fetchExplore("", platFilter, 0); }, [tab]);

  /* Infinite scroll sentinel */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreEx && !loadingEx && !loadingMoreEx) {
        const nextOffset = exploreOffset + 20;
        setExploreOffset(nextOffset);
        fetchExplore(searchQ, platFilter, nextOffset);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMoreEx, loadingEx, loadingMoreEx, exploreOffset, searchQ, platFilter]);

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
    <div style={{ minHeight:"100vh", background:"#060505", color:"#e8e4e0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Ambient background layers */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 10%,rgba(255,107,53,.4) 50%,transparent 90%)", pointerEvents:"none", zIndex:200 }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 70% 35% at 50% 0%,rgba(255,107,53,.07) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 45% 45% at 85% 85%,rgba(200,80,20,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 40% 50% at 8% 70%,rgba(167,139,250,.03) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", opacity:.022, pointerEvents:"none" }} />

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:68, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:"rgba(6,5,5,.9)", backdropFilter:"blur(32px) saturate(180%)", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        {/* Animated bottom border */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 0%,rgba(255,107,53,.22) 30%,rgba(255,209,102,.3) 50%,rgba(255,107,53,.22) 70%,transparent 100%)", pointerEvents:"none" }} />

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#ff6b35 0%,#c84400 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(255,107,53,.38), inset 0 1px 0 rgba(255,255,255,.2)" }}>
            <svg width="15" height="15" viewBox="0 0 26 26">
              <polygon points="0,5 26,0 26,21 0,26" fill="#fff" />
            </svg>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, letterSpacing:2.2, color:"rgba(255,255,255,.92)", textTransform:"uppercase" }}>
            game<span style={{ background:"linear-gradient(90deg,#ff6b35,#ffd166)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>diary</span>
          </span>
        </div>

        {/* Center nav */}
        <div className="nav-center" style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,.07)", paddingBottom:2 }}>
          {[["home","Accueil"],["explore","Explorer"],["discover","Découvrir"],["profile","Profil"]].map(([id,label]) => (
            <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {user ? (
            <>
              <div onClick={()=>setTab("profile")} style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#ff6b35,#ffd166)", display:"flex", alignItems:"center", justifyContent:"center", color:"#140800", fontWeight:800, fontSize:13, fontFamily:"'Syne',sans-serif", cursor:"pointer", boxShadow:"0 0 18px rgba(255,107,53,.3)", letterSpacing:.5, transition:"box-shadow .2s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 28px rgba(255,107,53,.55)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="0 0 18px rgba(255,107,53,.3)"}>
                {user.email?.slice(0,2).toUpperCase()}
              </div>
              <button onClick={logout} className="hide-m" style={{ background:"none", border:"1px solid rgba(255,255,255,.08)", borderRadius:9, color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:12, padding:"7px 13px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:"all .15s", letterSpacing:.2 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(248,113,113,.35)";e.currentTarget.style.color="#f87171";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.3)";}}>
                Déco
              </button>
            </>
          ) : (
            <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"8px 20px", fontSize:13 }}>Connexion</button>
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

            <div style={{ display:"flex", gap:10, marginTop:52, flexWrap:"wrap" }}>
              {[
                {n:"∞", l:"Jeux IGDB", hot:true},
                {n:"100%", l:"Gratuit", hot:true},
                {n:user?Object.keys(userRatings).length:"—", l:"Mes notes", hot:false},
                {n:user?Object.keys(userStatus).length:"—", l:"Ma liste", hot:false},
              ].map((s,i)=>(
                <div key={i} className="stat-mini">
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color: s.hot ? "#ff6b35" : "rgba(255,255,255,.8)", lineHeight:1, marginBottom:5, textShadow: s.hot ? "0 0 28px rgba(255,107,53,.5)" : "none" }}>{s.n}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.22)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:.8, fontWeight:600, textTransform:"uppercase" }}>{s.l}</div>
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
          <div className="bounce" style={{ position:"absolute", bottom:24, left:"50%", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:7, pointerEvents:"none" }}>
            <div style={{ width:28, height:44, border:"1.5px solid rgba(255,255,255,.12)", borderRadius:14, display:"flex", justifyContent:"center", padding:"6px 0" }}>
              <div style={{ width:3, height:10, background:"linear-gradient(to bottom,#ff6b35,#ffd166)", borderRadius:99 }} />
            </div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.15)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.5, textTransform:"uppercase" }}>Défiler</span>
          </div>
        </div>
      )}

      {/* ── Console ticker strip — double row infinite ── */}
      {tab==="home" && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)", padding:"10px 0", background:"rgba(255,255,255,.01)", overflow:"hidden" }}>
          {(() => {
            const row1 = ["◆ PlayStation 5","· Xbox Series X","◆ Xbox Series S","· Nintendo Switch","◆ Nintendo Switch OLED","· PC","◆ Steam Deck","· PlayStation 4","◆ PlayStation 4 Pro","· Xbox One","◆ Xbox One X","· Xbox One S","◆ PlayStation 3","· Xbox 360","◆ Wii","· Wii U","◆ GameCube","· Nintendo 64","◆ Super Nintendo","· NES","◆ Game Boy Advance","· GBA SP","◆ Nintendo DS","· Nintendo 3DS","◆ New 3DS XL","· PSP","◆ PS Vita","· PlayStation 2","◆ PlayStation","· Dreamcast"];
            const row2 = ["◆ Sega Mega Drive","· Sega Saturn","◆ Sega Master System","· Sega Game Gear","◆ Atari 2600","· Atari 7800","◆ Atari Jaguar","· Neo Geo","◆ Neo Geo Pocket","· Amiga","◆ Commodore 64","· MSX","◆ TurboGrafx-16","· Lynx","◆ Virtual Boy","· Game Boy Color","◆ Game Boy","· Famicom Disk","◆ PC Engine","· ColecoVision","◆ Intellivision","· Vectrex","◆ Odyssey","· Arcade","◆ Xbox","· Nintendo DS Lite","◆ iPhone","· Android","◆ Stadia","· Luna"];
            const track1 = [...row1, ...row1];
            const track2 = [...row2, ...row2];
            return <>
              <div className="marquee-wrap" style={{ marginBottom:7 }}>
                <div className="marquee-track">
                  {track1.map((g,i)=>(
                    <span key={i} style={{ fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.4, textTransform:"uppercase", whiteSpace:"nowrap", color:g.startsWith("◆")?"rgba(255,107,53,.32)":"rgba(255,255,255,.08)" }}>{g}</span>
                  ))}
                </div>
              </div>
              <div className="marquee-wrap">
                <div className="marquee-track-r">
                  {track2.map((g,i)=>(
                    <span key={i} style={{ fontSize:10, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2.4, textTransform:"uppercase", whiteSpace:"nowrap", color:g.startsWith("◆")?"rgba(255,209,102,.22)":"rgba(255,255,255,.07)" }}>{g}</span>
                  ))}
                </div>
              </div>
            </>;
          })()}
        </div>
      )}

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 22px 80px", position:"relative", zIndex:1 }}>

        {/* ══ HOME GRID ══ */}
        {tab==="home" && (
          <div style={{ paddingTop:56 }}>
            <div className="fu" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div className="sect-h">
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,107,53,.55)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>Les mieux notés</div>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#fff", letterSpacing:-.5, lineHeight:1 }}>Top jeux</h2>
                </div>
              </div>
              <button onClick={()=>setTab("explore")} style={{ background:"rgba(255,107,53,.07)", border:"1px solid rgba(255,107,53,.2)", borderRadius:99, color:"rgba(255,107,53,.85)", cursor:"pointer", fontSize:12, padding:"7px 18px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, transition:"all .18s", letterSpacing:.2 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.14)";e.currentTarget.style.color="#ff6b35";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,107,53,.07)";e.currentTarget.style.color="rgba(255,107,53,.85)";}}>
                Tout explorer →
              </button>
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
            {/* Header */}
            <div style={{ marginBottom:32, paddingBottom:28, borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20, marginBottom:20 }}>
                <div className="sect-h">
                  <div>
                    <div style={{ fontSize:10, color:"rgba(255,107,53,.55)", fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>IGDB · Millions de jeux</div>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>Explorer</h2>
                  </div>
                </div>
                {/* Search bar */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                    placeholder="Titre, série, genre…"
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:14, color:"rgba(255,255,255,.88)", padding:"12px 46px 12px 46px", fontSize:14, width:320, outline:"none", transition:"all .22s" }}
                    onFocus={e=>{e.target.style.borderColor="rgba(255,107,53,.48)";e.target.style.background="rgba(255,255,255,.06)";e.target.style.boxShadow="0 0 0 3px rgba(255,107,53,.09)";}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.09)";e.target.style.background="rgba(255,255,255,.04)";e.target.style.boxShadow="none";}}
                  />
                  <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", fontSize:17 }}>⌕</span>
                  {loadingEx
                    ? <div className="spin" style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }} />
                    : <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"rgba(255,255,255,.14)", fontFamily:"'Space Grotesk',sans-serif" }}>⌘K</span>
                  }
                </div>
              </div>
              {/* Platform chips — scrollable bar with arrows */}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>scrollPlat(-1)} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, lineHeight:1, transition:"all .2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.12)";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>‹</button>
                <div ref={platScrollRef} style={{ display:"flex", gap:7, overflowX:"auto", scrollbarWidth:"none", msOverflowStyle:"none", flex:1, maskImage:"linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)", WebkitMaskImage:"linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)" }}>
                  {PLATFORMS_FILTER.map(p=><button key={p} className={`chip ${platFilter===p?"on":""}`} style={{ flexShrink:0 }} onClick={()=>setPlatFilter(p)}>{p}</button>)}
                </div>
                <button onClick={()=>scrollPlat(1)} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, lineHeight:1, transition:"all .2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,53,.12)";e.currentTarget.style.borderColor="rgba(255,107,53,.3)";e.currentTarget.style.color="#ff6b35";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>›</button>
              </div>
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
                  {exploreGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
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
              <div style={{ textAlign:"center", padding:"100px 0" }}>
                <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(135deg,rgba(255,107,53,.1),rgba(255,209,102,.05))", border:"1px solid rgba(255,107,53,.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:36, boxShadow:"0 0 40px rgba(255,107,53,.08)" }}>🎮</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginBottom:10, letterSpacing:"-.5px" }}>Ton profil t'attend</h2>
                <p style={{ color:"rgba(255,255,255,.28)", marginBottom:28, fontSize:15, fontFamily:"'DM Sans',sans-serif", lineHeight:1.7 }}>Connecte-toi pour suivre ta progression,<br/>noter tes jeux et construire ta collection.</p>
                <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"13px 36px", fontSize:15 }}>Se connecter →</button>
              </div>
            ) : (
              <>
                {/* Profile banner */}
                <div className="profile-banner" style={{ marginBottom:28 }}>
                  <div style={{ position:"absolute", top:0, right:0, width:320, height:320, background:"radial-gradient(circle,rgba(255,107,53,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
                  <div style={{ display:"flex", gap:22, alignItems:"center", flexWrap:"wrap", position:"relative", zIndex:1 }}>
                    {/* Avatar */}
                    <div style={{ width:72, height:72, borderRadius:18, background:"linear-gradient(135deg,#ff6b35,#ffd166)", display:"flex", alignItems:"center", justifyContent:"center", color:"#140800", fontWeight:800, fontSize:26, fontFamily:"'Syne',sans-serif", flexShrink:0, boxShadow:"0 0 28px rgba(255,107,53,.35)" }}>
                      {user.email?.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:"rgba(255,107,53,.6)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:5 }}>Joueur</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#fff", marginBottom:18, letterSpacing:-.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:400 }}>{user.email}</h2>
                      {/* Stat cards in row */}
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        {[
                          { v:Object.keys(userRatings).length, l:"Jeux notés", icon:"⭐" },
                          { v:Object.keys(userStatus).length, l:"Dans ma liste", icon:"📋" },
                          { v:wishlistGames.length, l:"Envie de jouer", icon:"🔖" },
                          { v:Object.keys(userRatings).length>0?(Object.values(userRatings).reduce((a,b)=>a+b.rating,0)/Object.keys(userRatings).length).toFixed(1):"—", l:"Note moyenne", icon:"📊" },
                        ].map(s=>(
                          <div key={s.l} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:16 }}>{s.icon}</span>
                            <div>
                              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#ff6b35", lineHeight:1 }}>{s.v}</div>
                              <div style={{ color:"rgba(255,255,255,.25)", fontSize:10, fontFamily:"'Space Grotesk',sans-serif", marginTop:2, letterSpacing:.3 }}>{s.l}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wishlist */}
                {wishlistGames.length>0 && (
                  <div style={{ marginBottom:40 }}>
                    <div className="sect-h" style={{ marginBottom:18 }}>
                      <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.7)", letterSpacing:-.3 }}>
                        Envie de jouer <span style={{ color:"rgba(255,255,255,.2)", fontWeight:600 }}>· {wishlistGames.length}</span>
                      </h3>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:11 }}>
                      {wishlistGames.map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
                    </div>
                  </div>
                )}

                {/* Collection */}
                <div className="sect-h" style={{ marginBottom:18 }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"rgba(255,255,255,.7)", letterSpacing:-.3 }}>
                    Collection <span style={{ color:"rgba(255,255,255,.2)", fontWeight:600 }}>· {Object.keys(userRatings).length}</span>
                  </h3>
                </div>

                {Object.keys(userRatings).length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.15)", borderRadius:18, background:"rgba(255,255,255,.015)", border:"1px dashed rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize:48, marginBottom:14 }}>🎮</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:6 }}>Aucun jeu noté</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.1)", marginBottom:20 }}>Commence à explorer et noter des jeux</div>
                    <button onClick={()=>setTab("explore")} style={{ background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.25)", borderRadius:10, color:"#ff6b35", cursor:"pointer", fontSize:13, padding:"9px 22px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>Explorer les jeux →</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {allRatedGames.map(g=>{
                      const rv=userRatings[g.id];
                      const st=userStatus[g.id];
                      const col=rc(rv.rating);
                      return (
                        <div key={g.id} className="row" onClick={()=>setSelected(g)} style={{ padding:"14px 18px", display:"flex", gap:16, alignItems:"center" }}>
                          <div style={{ width:44, height:58, borderRadius:9, overflow:"hidden", flexShrink:0, border:"1px solid rgba(255,255,255,.07)", boxShadow:"0 4px 16px rgba(0,0,0,.4)" }}>
                            {g.cover ? <img src={g.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.opacity=0}/> : <div style={{ width:"100%", height:"100%", background:"#1a1208", display:"flex", alignItems:"center", justifyContent:"center" }}>🎮</div>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:"rgba(255,255,255,.85)", fontWeight:700, fontSize:14, fontFamily:"'Syne',sans-serif", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.title}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ color:"rgba(255,255,255,.22)", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{g.platform?.split("(")[0].trim()} · {g.year}</span>
                              {st && <span style={{ color:STATUS_CONFIG[st]?.color, fontSize:11, background:`${STATUS_CONFIG[st]?.color}15`, border:`1px solid ${STATUS_CONFIG[st]?.color}30`, borderRadius:5, padding:"1px 8px", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{STATUS_CONFIG[st]?.icon} {STATUS_CONFIG[st]?.label}</span>}
                            </div>
                            {rv.comment && <div style={{ color:"rgba(255,255,255,.22)", fontSize:12, marginTop:5, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{rv.comment.length>65?rv.comment.slice(0,65)+"…":rv.comment}"</div>}
                          </div>
                          {/* Rating pill */}
                          <div style={{ flexShrink:0, background:`${col}18`, border:`1px solid ${col}44`, borderRadius:10, padding:"6px 12px", textAlign:"center" }}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:col, lineHeight:1 }}>{rv.rating}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,.2)", fontFamily:"'Space Grotesk',sans-serif", marginTop:2 }}>/10</div>
                          </div>
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
