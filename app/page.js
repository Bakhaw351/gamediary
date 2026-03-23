"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GAMES = [
  { id:1,  title:"Elden Ring",                  platform:"PS5",       year:2022, genre:"RPG",          cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",  rating:9.6, reviews:21500, tags:["Souls-like","Open World","Dark Fantasy"] },
  { id:2,  title:"Zelda: Tears of the Kingdom", platform:"Switch",    year:2023, genre:"Aventure",     cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg",  rating:9.4, reviews:12840, tags:["Exploration","Crafting","Open World"] },
  { id:3,  title:"Red Dead Redemption 2",       platform:"PS4",       year:2018, genre:"Action",       cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg",  rating:9.7, reviews:34200, tags:["Western","Narrative","Open World"] },
  { id:4,  title:"Hollow Knight",               platform:"PC",        year:2017, genre:"Metroidvania", cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg",  rating:9.2, reviews:18900, tags:["Metroidvania","Difficile","Atmosphère"] },
  { id:5,  title:"Hades",                       platform:"PC",        year:2020, genre:"Roguelike",    cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co2uro.jpg",  rating:9.3, reviews:15600, tags:["Roguelike","Mythologie","Fast-paced"] },
  { id:6,  title:"God of War Ragnarök",         platform:"PS5",       year:2022, genre:"Action",       cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg",  rating:9.5, reviews:19300, tags:["Mythologie","Combat","Cinématique"] },
  { id:7,  title:"Cyberpunk 2077",              platform:"PC",        year:2020, genre:"RPG",          cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co4xi5.jpg",  rating:8.2, reviews:28400, tags:["Cyberpunk","Open World","FPS"] },
  { id:8,  title:"Stardew Valley",              platform:"Mobile",    year:2016, genre:"Simulation",   cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1ub9.jpg",  rating:9.0, reviews:22100, tags:["Farming","Relaxant","Mobile"] },
  { id:9,  title:"Dead Cells",                  platform:"Switch",    year:2018, genre:"Roguelike",    cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1tol.jpg",  rating:8.8, reviews:8900,  tags:["Roguelike","Pixel Art","Difficile"] },
  { id:10, title:"Sonic the Hedgehog",          platform:"Mega Drive",year:1991, genre:"Platformer",   cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1yww.jpg",  rating:8.4, reviews:4200,  tags:["Rétro","Speed","Platformer"] },
  { id:11, title:"Pokémon Rouge Feu",           platform:"GBA",       year:2004, genre:"RPG",          cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co3i7p.jpg",  rating:8.9, reviews:11200, tags:["Rétro","RPG","Pokémon"] },
  { id:12, title:"Super Mario Odyssey",         platform:"Switch",    year:2017, genre:"Platformer",   cover:"https://images.igdb.com/igdb/image/upload/t_cover_big/co1lbd.jpg",  rating:9.1, reviews:9700,  tags:["Platformer","Fun","Coloré"] },
];

const PLATFORMS = ["Tous","PS5","PS4","Switch","PC","Mobile","GBA","Mega Drive"];
const ALL_TAGS = [...new Set(GAMES.flatMap(g => g.tags))];

const FEED = [
  { user:"NightStalker", initials:"NS", gameId:1, rating:10, text:"Perfection absolue. Chaque détail de cet open world transpire l'effort. GOTY de la décennie.", likes:342, ago:"2h" },
  { user:"PixelQueen",   initials:"PQ", gameId:4, rating:9,  text:"Team Cherry a créé quelque chose d'unique. L'atmosphère, la musique... un chef-d'œuvre silencieux.", likes:218, ago:"5h" },
  { user:"RetroGuru",    initials:"RG", gameId:11,rating:9,  text:"Ma madeleine de Proust. Des heures infinies sur la GBA. Rien ne m'a autant marqué enfant.", likes:156, ago:"1j" },
];

const rc = r => r >= 9 ? "#76ff47" : r >= 7 ? "#ffb800" : "#ff4d4d";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #76b900; border-radius: 99px; }
  textarea, input { font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  .card-hover { transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, border-color .3s; }
  .card-hover:hover { transform: translateY(-6px) scale(1.02); border-color: rgba(118,185,0,.5) !important; box-shadow: 0 20px 60px rgba(118,185,0,.12) !important; }
  .row-hover { transition: background .2s, border-color .2s; }
  .row-hover:hover { background: rgba(118,185,0,.04) !important; border-color: rgba(118,185,0,.25) !important; }
  .nav-btn { transition: color .2s; }
  .nav-btn:hover { color: #e8eaed !important; }
  .inp { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; color: #fff; padding: 12px 16px; font-size: 14px; width: 100%; outline: none; transition: border-color .2s; }
  .inp:focus { border-color: #76b900; }
  .btn-green { background: linear-gradient(135deg,#76b900,#8fd100); color: #050505; border: none; border-radius: 10px; padding: 12px 28px; font-family: 'Syne',sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; transition: opacity .2s; }
  .btn-green:hover { opacity: .9; }
`;

/* ── SCORE RING ── */
const Ring = ({ value, size = 52 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 10) * circ;
  const color = rc(value);
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 6px ${color}99)` }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size < 44 ? 11 : 13} fontWeight="700" fontFamily="'Syne',sans-serif">{value}</text>
    </svg>
  );
};

/* ── FEATURED CARD ── */
const FeaturedCard = ({ game, onClick }) => {
  const [err, setErr] = useState(false);
  return (
    <div onClick={() => onClick(game)} className="card-hover" style={{ cursor:"pointer", borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,.06)", background:"#0d0e0f" }}>
      <div style={{ position:"relative", height:320 }}>
        {!err
          ? <img src={game.cover} onError={() => setErr(true)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ height:"100%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:60 }}>🎮</div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,9,9,.98) 0%,rgba(8,9,9,.3) 60%,transparent 100%)" }} />
        <div style={{ position:"absolute", top:16, left:16 }}>
          <span style={{ background:"rgba(118,185,0,.9)", color:"#050505", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>#1</span>
        </div>
        <div style={{ position:"absolute", top:14, right:14 }}><Ring value={game.rating} size={52} /></div>
        <div style={{ position:"absolute", bottom:20, left:20, right:20 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:4 }}>{game.platform} · {game.year}</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif" }}>{game.title}</div>
        </div>
      </div>
    </div>
  );
};

/* ── GAME CARD ── */
const GameCard = ({ game, onClick }) => {
  const [err, setErr] = useState(false);
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onClick(game)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="card-hover" style={{ cursor:"pointer", borderRadius:16, overflow:"hidden", background:"#0e1010", border:`1px solid ${hov ? "rgba(118,185,0,.5)" : "rgba(255,255,255,.06)"}` }}>
      <div style={{ position:"relative", paddingBottom:"140%", background:"#0a0b0b" }}>
        {!err
          ? <img src={game.cover} onError={() => setErr(true)} alt={game.title}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s", transform:hov?"scale(1.05)":"scale(1)" }} />
          : <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:40 }}>🎮</span>
              <span style={{ color:"rgba(255,255,255,.3)", fontSize:11, textAlign:"center", padding:"0 12px" }}>{game.title}</span>
            </div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,transparent 40%,rgba(8,9,9,.98) 100%)" }} />
        <div style={{ position:"absolute", top:10, right:10 }}><Ring value={game.rating} size={44} /></div>
        <div style={{ position:"absolute", bottom:10, left:10 }}>
          <span style={{ background:"rgba(0,0,0,.6)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"2px 8px", fontSize:10, color:"rgba(255,255,255,.5)", fontFamily:"'Syne',sans-serif" }}>{game.platform}</span>
        </div>
      </div>
      <div style={{ padding:"12px 14px 16px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.9)", fontFamily:"'Syne',sans-serif", lineHeight:1.3, marginBottom:4 }}>
          {game.title.length > 22 ? game.title.slice(0,22)+"…" : game.title}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>{game.genre} · {game.year}</div>
      </div>
    </div>
  );
};

/* ── AUTH MODAL ── */
const AuthModal = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({ id: data.user.id, username });
        }
        setSuccess("Compte créé ! Vérifie ton email pour confirmer.");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.8)", backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:420, borderRadius:20, background:"rgba(13,14,14,.98)", border:"1px solid rgba(255,255,255,.08)", overflow:"hidden", animation:"scaleIn .25s cubic-bezier(.34,1.3,.64,1)" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#76b900,#8fd100,transparent)" }} />
        <div style={{ padding:"32px 32px 36px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:"#fff" }}>
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h2>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:20 }}>✕</button>
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:24, background:"rgba(255,255,255,.04)", borderRadius:10, padding:4 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, background: mode===m ? "rgba(118,185,0,.15)" : "transparent", color: mode===m ? "#76ff47" : "rgba(255,255,255,.35)", border: mode===m ? "1px solid rgba(118,185,0,.3)" : "1px solid transparent", borderRadius:8, padding:"8px", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer" }}>
                {m === "login" ? "Se connecter" : "S'inscrire"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode === "signup" && (
              <input className="inp" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input className="inp" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="inp" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <div style={{ color:"#ff4d4d", fontSize:13, marginTop:12 }}>{error}</div>}
          {success && <div style={{ color:"#76ff47", fontSize:13, marginTop:12 }}>{success}</div>}

          <button className="btn-green" onClick={handle} disabled={loading} style={{ marginTop:20, opacity: loading ? .6 : 1 }}>
            {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── GAME MODAL ── */
const Modal = ({ game, onClose, user, userRatings, setUserRatings }) => {
  const [myR, setMyR] = useState(userRatings[game.id]?.rating || 0);
  const [hovR, setHovR] = useState(0);
  const [txt, setTxt] = useState(userRatings[game.id]?.comment || "");
  const [saved, setSaved] = useState(!!userRatings[game.id]);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const save = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!myR) return;
    setLoading(true);
    const { error } = await supabase.from("ratings").upsert({
      user_id: user.id,
      game_id: game.id,
      rating: myR,
      comment: txt,
    }, { onConflict: "user_id,game_id" });
    if (!error) {
      setUserRatings(p => ({...p, [game.id]: {rating: myR, comment: txt}}));
      setSaved(true);
    }
    setLoading(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,.7)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:760, maxHeight:"90vh", overflow:"auto", borderRadius:24, background:"rgba(13,14,14,.95)", border:"1px solid rgba(255,255,255,.08)", boxShadow:"0 40px 120px rgba(0,0,0,.9)", animation:"scaleIn .25s cubic-bezier(.34,1.3,.64,1)" }}>
          <div style={{ position:"relative", height:200, overflow:"hidden", borderRadius:"24px 24px 0 0" }}>
            {!err
              ? <img src={game.cover} onError={() => setErr(true)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"blur(2px) brightness(.5)", transform:"scale(1.05)" }} />
              : <div style={{ height:"100%", background:"linear-gradient(135deg,#0d1a00,#001a0d)" }} />
            }
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 0%,rgba(13,14,14,.9) 80%,rgba(13,14,14,1) 100%)" }} />
            <div style={{ position:"absolute", bottom:-28, left:32, width:90, borderRadius:12, overflow:"hidden", border:"2px solid rgba(118,185,0,.4)", boxShadow:"0 8px 32px rgba(0,0,0,.8)" }}>
              <div style={{ paddingBottom:"140%", position:"relative" }}>
                {!err
                  ? <img src={game.cover} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>🎮</div>
                }
              </div>
            </div>
            <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,.5)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:99, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.6)", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>

          <div style={{ padding:"44px 32px 32px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  <span style={{ background:"rgba(118,185,0,.15)", color:"#76ff47", border:"1px solid rgba(118,185,0,.3)", borderRadius:99, padding:"3px 12px", fontSize:11, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{game.platform}</span>
                  <span style={{ color:"rgba(255,255,255,.3)", fontSize:11 }}>{game.year} · {game.genre}</span>
                </div>
                <h2 style={{ fontSize:28, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif", lineHeight:1.15, maxWidth:420 }}>{game.title}</h2>
              </div>
              <Ring value={game.rating} size={64} />
            </div>

            <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
              {game.tags.map(t => <span key={t} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.4)", borderRadius:8, padding:"4px 12px", fontSize:12 }}>#{t}</span>)}
            </div>

            <div style={{ padding:"16px 20px", background:"rgba(255,255,255,.03)", borderRadius:12, marginBottom:28, border:"1px solid rgba(255,255,255,.06)", display:"flex", gap:24 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:rc(game.rating), fontFamily:"'Syne',sans-serif" }}>{game.rating}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:2 }}>Score global</div>
              </div>
              <div style={{ width:1, background:"rgba(255,255,255,.06)" }} />
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"rgba(255,255,255,.8)", fontFamily:"'Syne',sans-serif" }}>{game.reviews.toLocaleString()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:2 }}>Critiques</div>
              </div>
            </div>

            <div style={{ padding:"20px 24px", background:"rgba(118,185,0,.04)", border:"1px solid rgba(118,185,0,.12)", borderRadius:16, marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(118,185,0,.7)", fontFamily:"'Syne',sans-serif", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>
                {saved ? "✓ Critique enregistrée" : user ? "Votre évaluation" : "Connectez-vous pour noter"}
              </div>

              {!saved ? (
                <>
                  <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                    {Array.from({length:10}, (_,i) => {
                      const v = i+1, on = v <= (hovR || myR);
                      return <div key={v} onClick={() => setMyR(v)} onMouseEnter={() => setHovR(v)} onMouseLeave={() => setHovR(0)}
                        style={{ flex:1, height:36, borderRadius:8, background: on ? `${rc(v)}22` : "rgba(255,255,255,.04)", border:`1px solid ${on ? rc(v)+"66" : "rgba(255,255,255,.07)"}`, color: on ? rc(v) : "rgba(255,255,255,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer", transition:"all .15s", transform: hovR===v ? "translateY(-2px)" : "none" }}>{v}</div>;
                    })}
                  </div>
                  <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder={user ? "Votre analyse..." : "Connectez-vous pour écrire une critique"}
                    disabled={!user}
                    style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, color:"rgba(255,255,255,.8)", padding:"12px 16px", fontSize:14, resize:"vertical", minHeight:80, outline:"none", transition:"border-color .2s", opacity: user ? 1 : .5 }}
                    onFocus={e => e.target.style.borderColor = "rgba(118,185,0,.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                  />
                  <button onClick={save} disabled={loading} style={{ marginTop:12, background:"linear-gradient(135deg,#76b900,#8fd100)", color:"#050505", border:"none", borderRadius:10, padding:"11px 28px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    {loading ? "Enregistrement..." : user ? "Publier" : "Se connecter pour publier"}
                  </button>
                </>
              ) : (
                <div>
                  <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                    {Array.from({length:10}, (_,i) => {
                      const on = i < myR;
                      return <div key={i} style={{ flex:1, height:28, borderRadius:6, background: on ? `${rc(myR)}22` : "rgba(255,255,255,.04)", border:`1px solid ${on ? rc(myR)+"55":"rgba(255,255,255,.07)"}`, color: on ? rc(myR) : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{i+1}</div>;
                    })}
                  </div>
                  {txt && <p style={{ color:"rgba(255,255,255,.5)", fontSize:14, lineHeight:1.6, borderLeft:"2px solid rgba(118,185,0,.4)", paddingLeft:12, margin:0 }}>{txt}</p>}
                </div>
              )}
            </div>

            {FEED.filter(f => f.gameId === game.id).length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>COMMUNAUTÉ</div>
                {FEED.filter(f => f.gameId === game.id).map((f,i) => (
                  <div key={i} style={{ padding:"14px 16px", background:"rgba(255,255,255,.02)", borderRadius:12, border:"1px solid rgba(255,255,255,.05)", marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:"rgba(118,185,0,.15)", border:"1px solid rgba(118,185,0,.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#76ff47", fontWeight:700, fontSize:11, fontFamily:"'Syne',sans-serif" }}>{f.initials}</div>
                        <span style={{ color:"rgba(255,255,255,.7)", fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{f.user}</span>
                        <span style={{ color:"rgba(255,255,255,.2)", fontSize:12 }}>il y a {f.ago}</span>
                      </div>
                      <Ring value={f.rating} size={36} />
                    </div>
                    <p style={{ color:"rgba(255,255,255,.45)", fontSize:14, lineHeight:1.65, margin:"0 0 8px" }}>{f.text}</p>
                    <span style={{ color:"rgba(255,255,255,.2)", fontSize:12 }}>♥ {f.likes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />}
    </>
  );
};

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
export default function GameDiary() {
  const [tab, setTab] = useState("home");
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [plat, setPlat] = useState("Tous");
  const [userRatings, setUserRatings] = useState({});
  const [dtags, setDtags] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

  /* Auth listener */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  /* Load ratings when user logs in */
  useEffect(() => {
    if (!user) return;
    setLoadingRatings(true);
    supabase.from("ratings").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) {
        const r = {};
        data.forEach(d => r[d.game_id] = { rating: d.rating, comment: d.comment });
        setUserRatings(r);
      }
      setLoadingRatings(false);
    });
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRatings({});
  };

  const [igdbResults, setIgdbResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) { setIgdbResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/games?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setIgdbResults(data);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [q]);

  const filtered = q.length >= 2 ? igdbResults.map(g => ({
    id: g.id,
    title: g.name,
    platform: g.platforms?.[0]?.name || "Multi",
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : "—",
    genre: g.genres?.[0]?.name || "Jeu",
    cover: g.cover?.url ? `https:${g.cover.url.replace("t_thumb","t_cover_big")}` : null,
    rating: g.rating ? Math.round(g.rating / 10) / 1 : "—",
    reviews: g.total_rating_count || 0,
    tags: g.genres?.map(x => x.name) || [],
  })) : GAMES.filter(g => plat === "Tous" || g.platform === plat);
  const ratedG = GAMES.filter(g => userRatings[g.id]);
  const disco = dtags.length > 0 ? GAMES.filter(g => !userRatings[g.id] && g.tags.some(t => dtags.includes(t))) : [];

  const initials = user?.email?.slice(0,2).toUpperCase() || "?";

  return (
    <div style={{ minHeight:"100vh", background:"#080909", color:"#e8eaed", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(118,185,0,.3),transparent)", pointerEvents:"none", zIndex:200 }} />
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 60% 30% at 50% 0%,rgba(118,185,0,.06) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:"rgba(8,9,9,.92)", backdropFilter:"blur(20px) saturate(180%)", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <svg width="26" height="26" viewBox="0 0 26 26">
            <polygon points="0,5 26,0 26,21 0,26" fill="#76b900" style={{ filter:"drop-shadow(0 0 8px #76b90088)" }} />
          </svg>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:19, letterSpacing:2, color:"#f0f2f4", textTransform:"uppercase" }}>
            game<span style={{ color:"#76b900" }}>diary</span>
          </span>
        </div>

        <div style={{ display:"flex", gap:2, background:"rgba(255,255,255,.04)", borderRadius:12, padding:4, border:"1px solid rgba(255,255,255,.06)" }}>
          {[["home","Accueil"],["explore","Explorer"],["discover","Découvrir"],["profile","Profil"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} className="nav-btn" style={{ background: tab===id ? "rgba(118,185,0,.15)" : "transparent", color: tab===id ? "#76ff47" : "rgba(255,255,255,.35)", border: tab===id ? "1px solid rgba(118,185,0,.3)" : "1px solid transparent", borderRadius:9, padding:"6px 16px", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer" }}>{label}</button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {user ? (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,rgba(118,185,0,.2),rgba(118,185,0,.05))", border:"1px solid rgba(118,185,0,.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#76b900", fontWeight:800, fontSize:13, fontFamily:"'Syne',sans-serif" }}>{initials}</div>
              <button onClick={logout} style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:12, padding:"6px 12px" }}>Déconnexion</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background:"linear-gradient(135deg,#76b900,#8fd100)", color:"#050505", border:"none", borderRadius:10, padding:"8px 20px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>Connexion</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 24px 80px", position:"relative" }}>

        {/* HOME */}
        {tab === "home" && (
          <div style={{ animation:"fadeUp .4s ease both" }}>
            <div style={{ padding:"64px 0 52px", display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"1px solid rgba(255,255,255,.05)", marginBottom:52 }}>
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(118,185,0,.08)", border:"1px solid rgba(118,185,0,.2)", borderRadius:99, padding:"5px 14px", marginBottom:24 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#76b900", animation:"pulse 2s infinite" }} />
                  <span style={{ fontSize:12, color:"rgba(118,185,0,.8)", fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Votre journal gaming</span>
                </div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(44px,6vw,80px)", lineHeight:.92, letterSpacing:"-2px", color:"#fff", marginBottom:24 }}>
                  Notez<span style={{ color:"#76b900" }}>.</span><br />
                  Critiquez<span style={{ color:"rgba(255,255,255,.25)" }}>.</span><br />
                  Partagez<span style={{ color:"rgba(255,255,255,.1)" }}>.</span>
                </h1>
                <p style={{ fontSize:16, color:"rgba(255,255,255,.35)", maxWidth:420, lineHeight:1.7 }}>
                  De la Game Boy à la PS5 — notez, critiquez et découvrez vos prochains jeux.
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, flexShrink:0 }}>
                {[{n:GAMES.length,l:"Jeux"},{n:"200K",l:"Critiques"},{n:"50K",l:"Joueurs"},{n:"4.8★",l:"Note moyenne"}].map((s,i) => (
                  <div key={i} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:14, padding:"18px 20px", minWidth:120 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color: i===0 ? "#76b900" : "rgba(255,255,255,.8)", lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.25)", marginTop:4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:56 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:24 }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"rgba(255,255,255,.8)", letterSpacing:-.5 }}>Top cette semaine</h2>
                <button onClick={() => setTab("explore")} style={{ background:"none", border:"none", color:"rgba(118,185,0,.7)", cursor:"pointer", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>Voir tout →</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:12 }}>
                {[...GAMES].sort((a,b) => b.rating - a.rating).slice(0,3).map((g, i) => {
                  if (i === 0) return <FeaturedCard key={g.id} game={g} onClick={setSel} />;
                  return <GameCard key={g.id} game={g} onClick={setSel} />;
                })}
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"rgba(255,255,255,.8)", letterSpacing:-.5, marginBottom:20 }}>Activité récente</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {FEED.map((f,i) => {
                  const game = GAMES.find(g => g.id === f.gameId);
                  return (
                    <div key={i} className="row-hover" style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)", borderRadius:14, padding:"16px 20px", display:"flex", gap:16, alignItems:"flex-start" }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:"rgba(118,185,0,.1)", border:"1px solid rgba(118,185,0,.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#76b900", fontWeight:800, fontSize:12, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{f.initials}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", marginBottom:8 }}>
                          <span style={{ color:"rgba(255,255,255,.8)", fontWeight:600, fontSize:14, fontFamily:"'Syne',sans-serif" }}>{f.user}</span>
                          <span style={{ color:"rgba(255,255,255,.2)", fontSize:13 }}>a noté</span>
                          <span onClick={() => setSel(game)} style={{ color:"#76b900", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>{game?.title}</span>
                          <Ring value={f.rating} size={30} />
                          <span style={{ color:"rgba(255,255,255,.15)", fontSize:12, marginLeft:"auto" }}>il y a {f.ago}</span>
                        </div>
                        <p style={{ color:"rgba(255,255,255,.35)", fontSize:14, lineHeight:1.65, margin:0 }}>{f.text}</p>
                        <div style={{ marginTop:8, color:"rgba(255,255,255,.15)", fontSize:12 }}>♥ {f.likes}</div>
                      </div>
                      {game && (
                        <div onClick={() => setSel(game)} style={{ width:42, borderRadius:8, overflow:"hidden", cursor:"pointer", flexShrink:0, border:"1px solid rgba(255,255,255,.07)" }}>
                          <div style={{ paddingBottom:"140%", position:"relative" }}>
                            <img src={game.cover} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.opacity=0} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* EXPLORE */}
        {tab === "explore" && (
          <div style={{ paddingTop:48, animation:"fadeUp .35s ease both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32, paddingBottom:28, borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <div>
                <div style={{ fontSize:12, color:"rgba(118,185,0,.6)", fontWeight:600, fontFamily:"'Syne',sans-serif", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Bibliothèque</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:40, color:"#fff", letterSpacing:-1 }}>Explorer</h2>
              </div>
              <div style={{ position:"relative" }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..."
                  style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, color:"rgba(255,255,255,.8)", padding:"11px 16px 11px 42px", fontSize:14, width:260, outline:"none", transition:"border-color .2s" }}
                  onFocus={e => e.target.style.borderColor = "rgba(118,185,0,.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.07)"}
                />
                <span style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.2)", fontSize:16 }}>⌕</span>
              </div>
            </div>

            <div style={{ display:"flex", gap:8, marginBottom:32, flexWrap:"wrap" }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setPlat(p)} style={{ background: plat===p ? "rgba(118,185,0,.12)" : "transparent", color: plat===p ? "#76b900" : "rgba(255,255,255,.3)", border:`1px solid ${plat===p ? "rgba(118,185,0,.3)" : "rgba(255,255,255,.07)"}`, borderRadius:99, padding:"6px 16px", fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .18s" }}>{p}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14 }}>
              {filtered.map(g => <GameCard key={g.id} game={g} onClick={setSel} />)}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif" }}>Aucun résultat pour "{q}"</div>
            )}
          </div>
        )}

        {/* DISCOVER */}
        {tab === "discover" && (
          <div style={{ paddingTop:48, animation:"fadeUp .35s ease both" }}>
            <div style={{ paddingBottom:32, borderBottom:"1px solid rgba(255,255,255,.05)", marginBottom:44 }}>
              <div style={{ fontSize:12, color:"rgba(118,185,0,.6)", fontWeight:600, fontFamily:"'Syne',sans-serif", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Recommandations</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:40, color:"#fff", letterSpacing:-1, marginBottom:12 }}>Découvrir</h2>
              <p style={{ color:"rgba(255,255,255,.3)", fontSize:15 }}>Sélectionne tes univers. On trouve ton prochain jeu parfait.</p>
            </div>

            <div style={{ marginBottom:44 }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>Vos goûts</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {ALL_TAGS.map(t => {
                  const on = dtags.includes(t);
                  return <button key={t} onClick={() => setDtags(p => on ? p.filter(x => x!==t) : [...p,t])}
                    style={{ background: on ? "rgba(118,185,0,.12)" : "rgba(255,255,255,.03)", color: on ? "#76ff47" : "rgba(255,255,255,.35)", border:`1px solid ${on ? "rgba(118,185,0,.35)" : "rgba(255,255,255,.07)"}`, borderRadius:10, padding:"8px 16px", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, transition:"all .18s" }}>#{t}</button>;
                })}
              </div>
            </div>

            {dtags.length > 0 && (
              <>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:20 }}>{disco.length} jeux recommandés</div>
                {disco.length > 0
                  ? <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14 }}>
                      {disco.map(g => <GameCard key={g.id} game={g} onClick={setSel} />)}
                    </div>
                  : <div style={{ color:"rgba(255,255,255,.3)", fontSize:15, borderLeft:"2px solid rgba(118,185,0,.4)", paddingLeft:18 }}>Tu as déjà évalué tous les jeux correspondants !</div>
                }
              </>
            )}
            {dtags.length === 0 && (
              <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,.15)" }}>
                <div style={{ width:72, height:72, borderRadius:20, background:"rgba(118,185,0,.06)", border:"1px solid rgba(118,185,0,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>◎</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15 }}>Choisis tes préférences pour commencer</div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={{ paddingTop:48, animation:"fadeUp .35s ease both" }}>
            {!user ? (
              <div style={{ textAlign:"center", padding:"100px 0" }}>
                <div style={{ width:80, height:80, borderRadius:20, background:"rgba(118,185,0,.06)", border:"1px solid rgba(118,185,0,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:36 }}>👾</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginBottom:12 }}>Connecte-toi pour voir ton profil</h2>
                <p style={{ color:"rgba(255,255,255,.3)", marginBottom:28 }}>Sauvegarde tes notes et accède à ta collection</p>
                <button onClick={() => setShowAuth(true)} style={{ background:"linear-gradient(135deg,#76b900,#8fd100)", color:"#050505", border:"none", borderRadius:12, padding:"14px 32px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer" }}>Se connecter</button>
              </div>
            ) : (
              <>
                <div style={{ position:"relative", borderRadius:24, overflow:"hidden", background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.06)", padding:"40px 36px", marginBottom:48 }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#76b900,#8fd100 60%,transparent)" }} />
                  <div style={{ position:"absolute", top:0, right:0, width:300, height:300, background:"radial-gradient(circle,rgba(118,185,0,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
                  <div style={{ display:"flex", gap:24, alignItems:"center" }}>
                    <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,rgba(118,185,0,.2),rgba(118,185,0,.05))", border:"2px solid rgba(118,185,0,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>👾</div>
                    <div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontFamily:"'Syne',sans-serif", letterSpacing:3, textTransform:"uppercase", marginBottom:6 }}>Joueur</div>
                      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginBottom:14 }}>{user.email}</h2>
                      <div style={{ display:"flex", gap:32 }}>
                        {[{v:ratedG.length,l:"Jeux notés"},{v:ratedG.filter(g=>userRatings[g.id]?.comment).length,l:"Critiques"},{v:47,l:"Abonnés"}].map(s => (
                          <div key={s.l}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:"#76b900", lineHeight:1 }}>{s.v}</div>
                            <div style={{ color:"rgba(255,255,255,.25)", fontSize:12, marginTop:4 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"rgba(255,255,255,.6)", marginBottom:20 }}>
                  Collection <span style={{ color:"rgba(255,255,255,.2)" }}>· {ratedG.length}</span>
                </h3>

                {loadingRatings ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,.3)" }}>Chargement...</div>
                ) : ratedG.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.15)", fontFamily:"'Syne',sans-serif" }}>
                    <div style={{ fontSize:48, marginBottom:14 }}>📋</div>
                    Aucun jeu noté. Commencez par Explorer !
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:48 }}>
                    {ratedG.map(g => {
                      const rv = userRatings[g.id];
                      return (
                        <div key={g.id} onClick={() => setSel(g)} className="row-hover" style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)", borderRadius:14, padding:"14px 18px", display:"flex", gap:16, alignItems:"center", cursor:"pointer" }}>
                          <div style={{ width:44, height:58, borderRadius:8, overflow:"hidden", flexShrink:0, border:"1px solid rgba(255,255,255,.07)" }}>
                            <img src={g.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.opacity=0} />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ color:"rgba(255,255,255,.85)", fontWeight:600, fontSize:15, fontFamily:"'Syne',sans-serif", marginBottom:3 }}>{g.title}</div>
                            <div style={{ color:"rgba(255,255,255,.25)", fontSize:12 }}>{g.platform} · {g.year}</div>
                            {rv.comment && <div style={{ color:"rgba(255,255,255,.25)", fontSize:13, marginTop:5, fontStyle:"italic" }}>"{rv.comment}"</div>}
                          </div>
                          <Ring value={rv.rating} size={48} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {ratedG.length > 0 && (
                  <>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"rgba(255,255,255,.6)", marginBottom:16 }}>Statistiques</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                      {[
                        { v:(Object.values(userRatings).reduce((a,b)=>a+b.rating,0)/Object.keys(userRatings).length).toFixed(1), l:"Note moyenne", c:"#76b900" },
                        { v:ratedG[0]?.platform || "—", l:"Dernière plateforme", c:"rgba(255,255,255,.7)" },
                        { v:ratedG.length, l:"Jeux dans la collection", c:"rgba(255,255,255,.7)" },
                      ].map(s => (
                        <div key={s.l} style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)", borderRadius:16, padding:"24px" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36, color:s.c, lineHeight:1, letterSpacing:-1 }}>{s.v}</div>
                          <div style={{ color:"rgba(255,255,255,.25)", fontSize:13, marginTop:8 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {sel && <Modal game={sel} onClose={() => setSel(null)} user={user} userRatings={userRatings} setUserRatings={setUserRatings} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={u => { setUser(u); setShowAuth(false); }} />}
    </div>
  );
}