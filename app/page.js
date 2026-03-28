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
  playing:   { label: "En cours",       icon: "🎮", color: "#76b900" },
  completed: { label: "Terminé",        icon: "✅", color: "#34d399" },
  dropped:   { label: "Abandonné",      icon: "❌", color: "#f87171" },
};

const formatRating = r => r ? Math.min(10, Math.round(r / 10)) : null;
const formatCover  = url => url ? `https:${url.replace("t_thumb","t_cover_big")}` : null;
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
});

const rc = r => !r ? "rgba(255,255,255,.3)" : r >= 8 ? "#76ff47" : r >= 6 ? "#ffb800" : "#ff4d4d";

/* ── CSS ─────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#060708;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#76b900;border-radius:99px;}
  textarea,input,button{font-family:'DM Sans',sans-serif;}

  @keyframes fadeUp  {from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn  {from{opacity:0;}to{opacity:1;}}
  @keyframes scaleIn {from{opacity:0;transform:scale(.94);}to{opacity:1;transform:scale(1);}}
  @keyframes pulse   {0%,100%{opacity:.4;}50%{opacity:1;}}
  @keyframes spin    {to{transform:rotate(360deg);}}
  @keyframes shimmer {from{background-position:-500px 0;}to{background-position:500px 0;}}
  @keyframes slideUp {from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}

  .fu  {animation:fadeUp  .45s cubic-bezier(.4,0,.2,1) both;}
  .fu2 {animation:fadeUp  .45s .1s cubic-bezier(.4,0,.2,1) both;}
  .fu3 {animation:fadeUp  .45s .2s cubic-bezier(.4,0,.2,1) both;}

  .card{cursor:pointer;border-radius:14px;overflow:hidden;background:#0c0d0f;border:1px solid rgba(255,255,255,.06);transition:transform .28s cubic-bezier(.34,1.4,.64,1),box-shadow .28s,border-color .2s;}
  .card:hover{transform:translateY(-7px) scale(1.02);border-color:rgba(118,185,0,.4);box-shadow:0 20px 56px rgba(118,185,0,.1),0 0 0 1px rgba(118,185,0,.14);}
  .card img{transition:transform .45s ease;}
  .card:hover img{transform:scale(1.07);}

  .row{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:13px;transition:background .2s,border-color .2s;cursor:pointer;}
  .row:hover{background:rgba(118,185,0,.04);border-color:rgba(118,185,0,.18);}

  .btn{background:linear-gradient(135deg,#76b900,#8fd100);color:#050505;border:none;border-radius:10px;padding:11px 26px;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:opacity .18s,transform .15s;letter-spacing:.2px;}
  .btn:hover{opacity:.88;transform:translateY(-1px);}
  .btn:active{transform:translateY(0);}
  .btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}

  .inp{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#e8eaed;padding:12px 16px;font-size:14px;width:100%;outline:none;transition:border-color .2s,background .2s;}
  .inp:focus{border-color:#76b900;background:rgba(255,255,255,.07);}
  .inp::placeholder{color:rgba(255,255,255,.25);}

  .skel{background:linear-gradient(90deg,#0f1012 25%,#161719 50%,#0f1012 75%);background-size:500px 100%;animation:shimmer 1.5s infinite;border-radius:10px;}

  .nav-btn{background:transparent;border:1px solid transparent;border-radius:9px;padding:7px 15px;font-family:'Syne',sans-serif;font-weight:600;font-size:13px;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.32);letter-spacing:-.1px;}
  .nav-btn:hover{color:rgba(255,255,255,.65);}
  .nav-btn.active{background:rgba(118,185,0,.11);border-color:rgba(118,185,0,.28);color:#76ff47;}

  .chip{background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:99px;padding:5px 14px;font-size:12px;font-weight:600;font-family:'Syne',sans-serif;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.32);white-space:nowrap;}
  .chip:hover{border-color:#76b900;color:#76b900;}
  .chip.on{background:rgba(118,185,0,.1);border-color:rgba(118,185,0,.35);color:#76b900;}

  .tag{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;font-family:'Syne',sans-serif;cursor:pointer;transition:all .18s;color:rgba(255,255,255,.32);}
  .tag:hover{background:rgba(118,185,0,.07);border-color:rgba(118,185,0,.28);color:#76b900;}
  .tag.on{background:rgba(118,185,0,.11);border-color:rgba(118,185,0,.38);color:#76ff47;box-shadow:0 0 12px rgba(118,185,0,.1);}

  .spin{width:18px;height:18px;border:2px solid rgba(118,185,0,.2);border-top-color:#76b900;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

  .status-btn{border:none;border-radius:9px;padding:8px 16px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px;letter-spacing:.2px;}

  /* Cinematic game page */
  .cinematic-hero{position:relative;height:100vh;min-height:600px;overflow:hidden;display:flex;align-items:flex-end;}
  .cinematic-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.35) saturate(1.2);transform:scale(1.05);transition:transform 8s ease;}
  .cinematic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(6,7,8,1) 0%,rgba(6,7,8,.7) 40%,rgba(6,7,8,.2) 80%,transparent 100%);}
  .cinematic-overlay-2{position:absolute;inset:0;background:linear-gradient(to right,rgba(6,7,8,.8) 0%,transparent 60%);}

  @media(max-width:768px){
    .hide-m{display:none!important;}
    .g2{grid-template-columns:repeat(2,1fr)!important;}
    .hero-t{font-size:40px!important;}
    .nav-center{gap:1px!important;}
    .nav-btn{padding:6px 9px!important;font-size:11px!important;}
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
      <div style={{ position:"relative", paddingBottom:"140%", background:"#090a0b" }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(135deg,#0d0e10,#111)" }}>
              <span style={{ fontSize:34 }}>🎮</span>
              <span style={{ color:"rgba(255,255,255,.18)", fontSize:10, textAlign:"center", padding:"0 10px", fontFamily:"'Syne',sans-serif", lineHeight:1.3 }}>{game.title}</span>
            </div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(170deg,transparent 48%,rgba(6,7,8,.96) 100%)" }} />
        {rank && <div style={{ position:"absolute", top:9, left:9, background:"rgba(118,185,0,.88)", color:"#050505", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>#{rank}</div>}
        <div style={{ position:"absolute", top:9, right:9 }}><Ring value={game.rating} size={40} /></div>
        <div style={{ position:"absolute", bottom:9, left:9 }}>
          <span style={{ background:"rgba(0,0,0,.62)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,.09)", borderRadius:5, padding:"2px 7px", fontSize:10, color:"rgba(255,255,255,.5)", fontFamily:"'Syne',sans-serif" }}>
            {game.platform.length > 12 ? game.platform.slice(0,12)+"…" : game.platform}
          </span>
        </div>
      </div>
      <div style={{ padding:"10px 12px 13px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.85)", fontFamily:"'Syne',sans-serif", lineHeight:1.3, marginBottom:3 }}>
          {game.title.length > 22 ? game.title.slice(0,22)+"…" : game.title}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontFamily:"'DM Sans',sans-serif" }}>{game.genre} · {game.year}</div>
      </div>
    </div>
  );
};

/* ── FEATURED CARD ────────────────────────────────────────── */
const FeaturedCard = ({ game, onClick }) => {
  const [e, setE] = useState(false);
  return (
    <div className="card" onClick={() => onClick(game)} style={{ borderRadius:18 }}>
      <div style={{ position:"relative", height:290 }}>
        {game.cover && !e
          ? <img src={game.cover} onError={() => setE(true)} alt={game.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ height:"100%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:56 }}>🎮</div>}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,7,8,1) 0%,rgba(6,7,8,.45) 55%,transparent 100%)" }} />
        <div style={{ position:"absolute", top:13, left:13 }}>
          <span style={{ background:"rgba(118,185,0,.9)", color:"#050505", borderRadius:7, padding:"3px 9px", fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>#1</span>
        </div>
        <div style={{ position:"absolute", top:11, right:11 }}><Ring value={game.rating} size={48} /></div>
        <div style={{ position:"absolute", bottom:16, left:16, right:16 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.38)", fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{game.platform.split("(")[0].trim()} · {game.year}</div>
          <div style={{ fontSize:19, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif", lineHeight:1.2 }}>{game.title}</div>
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
        <div style={{ height:3, background:"linear-gradient(90deg,#76b900,#8fd100,transparent)" }} />
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
                style={{ flex:1, background:mode===m?"rgba(118,185,0,.13)":"transparent", color:mode===m?"#76ff47":"rgba(255,255,255,.32)", border:mode===m?"1px solid rgba(118,185,0,.28)":"1px solid transparent", borderRadius:7, padding:"8px", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700, cursor:"pointer", transition:"all .15s" }}>{l}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {mode === "signup" && <input className="inp" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />}
            <input className="inp" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
            <input className="inp" type="password" placeholder="Mot de passe (6 min)" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
          </div>

          {err && <div style={{ color:"#ff6b6b", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(255,77,77,.07)", borderRadius:8, border:"1px solid rgba(255,77,77,.14)" }}>{err}</div>}
          {ok  && <div style={{ color:"#76ff47", fontSize:13, marginTop:10, padding:"9px 12px", background:"rgba(118,255,71,.07)", borderRadius:8, border:"1px solid rgba(118,255,71,.14)" }}>{ok}</div>}

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
        {game.cover && (
          <div className="cinematic-bg" style={{ backgroundImage:`url(${game.cover})`, transform: bgLoaded ? "scale(1)" : "scale(1.08)", transition:"transform 1.2s ease, filter .8s ease", filter: bgLoaded ? "brightness(.35) saturate(1.3)" : "brightness(0) saturate(1)" }} />
        )}
        <div className="cinematic-overlay" />
        <div className="cinematic-overlay-2" />

        <div style={{ position:"relative", zIndex:2, padding:"0 48px 56px", maxWidth:900, width:"100%", animation:"slideUp .6s .2s cubic-bezier(.4,0,.2,1) both" }}>
          {/* Badges */}
          <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ background:"rgba(118,185,0,.15)", color:"#76ff47", border:"1px solid rgba(118,185,0,.3)", borderRadius:99, padding:"4px 14px", fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>
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
          <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
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
        <div style={{ background:"rgba(118,185,0,.04)", border:"1px solid rgba(118,185,0,.1)", borderRadius:18, padding:"24px 26px", marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(118,185,0,.6)", fontFamily:"'Syne',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:16 }}>
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
                onFocus={e => e.target.style.borderColor="rgba(118,185,0,.4)"}
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
              {txt && <p style={{ color:"rgba(255,255,255,.45)", fontSize:14, lineHeight:1.65, borderLeft:"2px solid rgba(118,185,0,.35)", paddingLeft:12, margin:0, fontStyle:"italic" }}>{txt}</p>}
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
  const fetchExplore = useCallback(async q => {
    setLoadingEx(true);
    const query = q.length>=2 ? q : POPULAR_QUERIES[Math.floor(Math.random()*POPULAR_QUERIES.length)];
    try {
      const data = await fetch(`/api/games?q=${encodeURIComponent(query)}`).then(r=>r.json());
      setExploreGames(data.map(formatGame).filter(g=>g.cover));
    } catch {}
    setLoadingEx(false);
  }, []);

  useEffect(() => {
    if (tab!=="explore") return;
    const t = setTimeout(()=>fetchExplore(searchQ), searchQ.length>=2?500:0);
    return ()=>clearTimeout(t);
  }, [searchQ, tab]);

  useEffect(() => { if (tab==="explore"&&exploreGames.length===0) fetchExplore(""); }, [tab]);

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
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(118,185,0,.22),transparent)", pointerEvents:"none", zIndex:200 }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 50% 25% at 50% 0%,rgba(118,185,0,.05) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 26px", background:"rgba(6,7,8,.92)", backdropFilter:"blur(22px) saturate(180%)", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <svg width="22" height="22" viewBox="0 0 26 26">
            <polygon points="0,5 26,0 26,21 0,26" fill="#76b900" style={{ filter:"drop-shadow(0 0 6px #76b90099)" }} />
          </svg>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, letterSpacing:1.5, color:"#f0f2f4", textTransform:"uppercase" }}>
            game<span style={{ color:"#76b900" }}>diary</span>
          </span>
        </div>

        <div className="nav-center" style={{ display:"flex", gap:3, background:"rgba(255,255,255,.04)", borderRadius:11, padding:4, border:"1px solid rgba(255,255,255,.06)" }}>
          {[["home","Accueil"],["explore","Explorer"],["discover","Découvrir"],["profile","Profil"]].map(([id,label]) => (
            <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          {user ? (
            <>
              <div style={{ width:33, height:33, borderRadius:9, background:"linear-gradient(135deg,rgba(118,185,0,.17),rgba(118,185,0,.04))", border:"1px solid rgba(118,185,0,.26)", display:"flex", alignItems:"center", justifyContent:"center", color:"#76b900", fontWeight:800, fontSize:12, fontFamily:"'Syne',sans-serif", cursor:"pointer" }} onClick={()=>setTab("profile")}>
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

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 22px 80px", position:"relative", zIndex:1 }}>

        {/* ══ HOME ══ */}
        {tab==="home" && (
          <div>
            <div className="fu" style={{ padding:"62px 0 50px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,.05)", marginBottom:50, gap:36, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:260 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(118,185,0,.07)", border:"1px solid rgba(118,185,0,.16)", borderRadius:99, padding:"5px 13px", marginBottom:20 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#76b900", animation:"pulse 2s infinite" }} />
                  <span style={{ fontSize:11, color:"rgba(118,185,0,.75)", fontWeight:600, fontFamily:"'Syne',sans-serif", letterSpacing:.5 }}>Votre journal gaming</span>
                </div>
                <h1 className="hero-t" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(42px,5.2vw,70px)", lineHeight:.92, letterSpacing:"-2.5px", color:"#fff", marginBottom:20 }}>
                  Notez<span style={{ color:"#76b900", textShadow:"0 0 50px rgba(118,185,0,.35)" }}>.</span><br/>
                  Critiquez<span style={{ color:"rgba(255,255,255,.18)" }}>.</span><br/>
                  Partagez<span style={{ color:"rgba(255,255,255,.07)" }}>.</span>
                </h1>
                <p style={{ fontSize:15, color:"rgba(255,255,255,.3)", maxWidth:380, lineHeight:1.8, fontFamily:"'DM Sans',sans-serif" }}>
                  De la Game Boy à la PS5. Des millions de jeux, une seule app pour cataloguer ton histoire gaming.
                </p>
                {!user && <button className="btn" onClick={()=>setShowAuth(true)} style={{ marginTop:26, padding:"12px 30px", fontSize:15 }}>Commencer gratuitement →</button>}
              </div>
              <div className="hide-m" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, flexShrink:0 }}>
                {[{n:"∞",l:"Jeux IGDB"},{n:"100%",l:"Gratuit"},{n:user?Object.keys(userRatings).length:"0",l:"Mes notes"},{n:user?Object.keys(userStatus).length:"0",l:"Ma liste"}].map((s,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:13, padding:"16px 20px", minWidth:120 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:i<2?"#76b900":"rgba(255,255,255,.72)", lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.22)", marginTop:5 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fu2">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, color:"rgba(255,255,255,.75)", letterSpacing:-.5 }}>Top jeux</h2>
                <button onClick={()=>setTab("explore")} style={{ background:"none", border:"none", color:"rgba(118,185,0,.65)", cursor:"pointer", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Tout explorer →</button>
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
            </div>

            {topGames.length>3 && (
              <div className="fu3" style={{ marginTop:11 }}>
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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, paddingBottom:22, borderBottom:"1px solid rgba(255,255,255,.05)", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, color:"rgba(118,185,0,.55)", fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:5 }}>IGDB · Millions de jeux</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36, color:"#fff", letterSpacing:-1 }}>Explorer</h2>
              </div>
              <div style={{ position:"relative", flexShrink:0 }}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  placeholder="Rechercher un jeu..."
                  style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:11, color:"rgba(255,255,255,.8)", padding:"10px 15px 10px 40px", fontSize:14, width:280, outline:"none", transition:"all .2s" }}
                  onFocus={e=>{e.target.style.borderColor="rgba(118,185,0,.4)";e.target.style.background="rgba(255,255,255,.06)";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.08)";e.target.style.background="rgba(255,255,255,.04)";}}
                />
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.22)", fontSize:15 }}>⌕</span>
                {loadingEx && <div className="spin" style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)" }} />}
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                {exploreGames.filter(g=>platFilter==="Tous"||g.platform.toLowerCase().includes(platFilter.toLowerCase())).map(g=><GameCard key={g.id} game={g} onClick={setSelected}/>)}
              </div>
            )}
          </div>
        )}

        {/* ══ DISCOVER ══ */}
        {tab==="discover" && (
          <div className="fu" style={{ paddingTop:42 }}>
            <div style={{ paddingBottom:26, borderBottom:"1px solid rgba(255,255,255,.05)", marginBottom:38 }}>
              <div style={{ fontSize:11, color:"rgba(118,185,0,.55)", fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:2.5, textTransform:"uppercase", marginBottom:5 }}>Recommandations</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36, color:"#fff", letterSpacing:-1, marginBottom:8 }}>Découvrir</h2>
              <p style={{ color:"rgba(255,255,255,.26)", fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>Sélectionne tes univers — on trouve ton prochain jeu parmi des millions de titres.</p>
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
                  <div style={{ color:"rgba(255,255,255,.25)", fontSize:14, borderLeft:"2px solid rgba(118,185,0,.3)", paddingLeft:16 }}>Aucun résultat. Essaie d'autres préférences !</div>
                ) : null}
              </div>
            )}
            {activeTags.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.14)" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"rgba(118,185,0,.05)", border:"1px solid rgba(118,185,0,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26 }}>◎</div>
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
                <div style={{ width:72, height:72, borderRadius:18, background:"rgba(118,185,0,.05)", border:"1px solid rgba(118,185,0,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>👾</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#fff", marginBottom:8 }}>Ton profil t'attend</h2>
                <p style={{ color:"rgba(255,255,255,.26)", marginBottom:24, fontSize:14 }}>Connecte-toi pour accéder à ta collection</p>
                <button className="btn" onClick={()=>setShowAuth(true)} style={{ padding:"12px 32px", fontSize:15 }}>Se connecter</button>
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div style={{ position:"relative", borderRadius:20, overflow:"hidden", background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.06)", padding:"32px 28px", marginBottom:40 }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#76b900,#8fd100 55%,transparent)" }} />
                  <div style={{ position:"absolute", top:0, right:0, width:280, height:280, background:"radial-gradient(circle,rgba(118,185,0,.05) 0%,transparent 70%)", pointerEvents:"none" }} />
                  <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ width:66, height:66, borderRadius:16, background:"linear-gradient(135deg,rgba(118,185,0,.17),rgba(118,185,0,.04))", border:"2px solid rgba(118,185,0,.26)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>👾</div>
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
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#76b900", lineHeight:1 }}>{s.v}</div>
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
                    <button onClick={()=>setTab("explore")} style={{ marginTop:14, background:"none", border:"1px solid rgba(118,185,0,.28)", borderRadius:9, color:"#76b900", cursor:"pointer", fontSize:13, padding:"7px 18px", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>Explorer →</button>
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
