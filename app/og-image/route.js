import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  // Fetch real top game covers
  let covers = [];
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://joystick-log.com';
    const data = await fetch(`${base}/api/games/home`, { next: { revalidate: 3600 } }).then(r => r.json());
    covers = (data.top || [])
      .filter(g => g.cover?.url)
      .slice(0, 4)
      .map(g => `https:${g.cover.url.replace('t_thumb', 't_cover_big')}`);
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #09080e 0%, #130a04 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Arial Black, sans-serif',
        }}
      >
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-80, left:-80, width:400, height:400, borderRadius:'50%', background:'rgba(255,107,53,0.09)', filter:'blur(80px)', display:'flex' }} />
        <div style={{ position:'absolute', bottom:-60, right:-60, width:340, height:340, borderRadius:'50%', background:'rgba(255,209,102,0.07)', filter:'blur(70px)', display:'flex' }} />

        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg, #ff6b35, #ffd166)', display:'flex' }} />

        {/* Logo row */}
        <div style={{ display:'flex', alignItems:'center', gap:16, position:'absolute', top:52, left:80 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#ff6b35', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="4"/>
              <line x1="8" y1="9" x2="8" y2="15"/>
              <line x1="5" y1="12" x2="11" y2="12"/>
              <circle cx="16" cy="10" r="1.2" fill="white" stroke="none"/>
              <circle cx="19" cy="12" r="1.2" fill="white" stroke="none"/>
              <circle cx="16" cy="14" r="1.2" fill="white" stroke="none"/>
              <circle cx="13" cy="12" r="1.2" fill="white" stroke="none"/>
            </svg>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <div style={{ fontSize:38, fontWeight:900, letterSpacing:-1, color:'white', display:'flex' }}>
              Joystick<span style={{ color:'#ff6b35' }}>Log</span>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:3, textTransform:'uppercase', fontFamily:'Arial, sans-serif', fontWeight:700, display:'flex' }}>
              GAME JOURNAL
            </div>
          </div>
          <div style={{ marginLeft:8, padding:'5px 14px', borderRadius:99, background:'rgba(255,107,53,0.15)', border:'1px solid rgba(255,107,53,0.35)', display:'flex' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#ff6b35', letterSpacing:2, fontFamily:'Arial,sans-serif' }}>GRATUIT</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ position:'absolute', top:152, left:80, width:580, height:1, background:'rgba(255,255,255,0.07)', display:'flex' }} />

        {/* Main headline */}
        <div style={{ position:'absolute', top:178, left:80, display:'flex', flexDirection:'column', gap:0 }}>
          <div style={{ fontSize:70, fontWeight:900, color:'white', letterSpacing:-2, lineHeight:1.05, display:'flex' }}>Note. Critique.</div>
          <div style={{ fontSize:70, fontWeight:900, letterSpacing:-2, lineHeight:1.05, display:'flex' }}>
            <span style={{ color:'#ff6b35' }}>Partage</span>
            <span style={{ color:'white' }}>&nbsp;tes jeux.</span>
          </div>
        </div>

        {/* Subtitle */}
        <div style={{ position:'absolute', top:370, left:80, fontSize:22, color:'rgba(255,255,255,0.38)', fontFamily:'Arial, sans-serif', display:'flex' }}>
          Des millions de jeux · De la Game Boy à la PS5
        </div>

        {/* URL */}
        <div style={{ position:'absolute', bottom:52, left:80, fontSize:20, fontWeight:700, color:'rgba(255,107,53,0.7)', letterSpacing:1, fontFamily:'Arial, sans-serif', display:'flex' }}>
          joystick-log.com
        </div>

        {/* Game covers — real IGDB images */}
        <div style={{ position:'absolute', top:80, right:70, display:'flex', gap:12 }}>
          {[0,1].map(i => (
            <div key={i} style={{ display:'flex', flexDirection:'column', gap:12, marginTop: i === 0 ? 40 : 0 }}>
              {[0,1].map(j => {
                const cover = covers[i*2+j];
                return (
                  <div key={j} style={{ width:130, height:180, borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 40px rgba(0,0,0,0.6)' }}>
                    {cover
                      ? <img src={cover} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontSize:32 }}>🎮</span>
                    }
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
