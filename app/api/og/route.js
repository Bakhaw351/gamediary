import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title  = searchParams.get('title')  || 'JoystickLog';
  const cover  = searchParams.get('cover')  || '';
  const rating = searchParams.get('rating') || '';
  const year   = searchParams.get('year')   || '';

  const coverUrl = cover
    ? (cover.startsWith('//') ? `https:${cover}` : cover).replace('t_thumb', 't_cover_big')
    : '';

  const ratingNum = parseFloat(rating);
  const ratingColor = ratingNum >= 8 ? '#ffd166' : ratingNum >= 6 ? '#ff6b35' : ratingNum >= 4 ? '#f87171' : '#94a3b8';

  return new ImageResponse(
    (
      <div style={{ width:'1200px', height:'630px', display:'flex', background:'linear-gradient(135deg,#09080e 0%,#130a04 100%)', position:'relative', overflow:'hidden', fontFamily:'Arial Black, sans-serif' }}>
        {/* Glow */}
        <div style={{ position:'absolute', top:-100, left:-100, width:500, height:500, borderRadius:'50%', background:'rgba(255,107,53,0.08)', filter:'blur(90px)', display:'flex' }} />
        <div style={{ position:'absolute', bottom:-80, right:-80, width:400, height:400, borderRadius:'50%', background:'rgba(255,209,102,0.06)', filter:'blur(80px)', display:'flex' }} />

        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#ff6b35,#ffd166)', display:'flex' }} />

        {/* Game cover */}
        {coverUrl ? (
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:380, display:'flex' }}>
            <img src={coverUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #09080e 0%, transparent 60%)', display:'flex' }} />
          </div>
        ) : (
          <div style={{ position:'absolute', right:80, top:80, width:280, height:380, borderRadius:18, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:72 }}>🎮</span>
          </div>
        )}

        {/* Left content */}
        <div style={{ position:'absolute', left:80, top:60, display:'flex', flexDirection:'column' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, borderRadius:11, background:'#ff6b35', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="4"/>
                <line x1="8" y1="9" x2="8" y2="15"/>
                <line x1="5" y1="12" x2="11" y2="12"/>
                <circle cx="16" cy="10" r="1.2" fill="white" stroke="none"/>
                <circle cx="19" cy="12" r="1.2" fill="white" stroke="none"/>
              </svg>
            </div>
            <span style={{ fontSize:22, fontWeight:900, color:'rgba(255,255,255,0.5)', letterSpacing:1, display:'flex' }}>JoystickLog</span>
          </div>

          {/* Game title */}
          <div style={{ fontSize: title.length > 20 ? 52 : 64, fontWeight:900, color:'white', letterSpacing:-2, lineHeight:1.05, maxWidth:680, display:'flex', flexWrap:'wrap' }}>
            {title}
          </div>

          {/* Year */}
          {year && year !== '—' && (
            <div style={{ fontSize:18, color:'rgba(255,255,255,0.35)', marginTop:16, fontFamily:'Arial,sans-serif', display:'flex' }}>
              {year}
            </div>
          )}

          {/* Rating */}
          {rating && (
            <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:32 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:90, height:90, borderRadius:18, background:`${ratingColor}18`, border:`2px solid ${ratingColor}`, display:'flex' }}>
                <span style={{ fontSize:42, fontWeight:900, color:ratingColor, fontFamily:'Arial Black', display:'flex' }}>{rating}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.3)', fontFamily:'Arial,sans-serif', letterSpacing:2, textTransform:'uppercase', display:'flex' }}>Note IGDB</span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.2)', fontFamily:'Arial,sans-serif', display:'flex' }}>sur 10</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop:48, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,107,53,0.15)', border:'1px solid rgba(255,107,53,0.35)', display:'flex' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#ff6b35', fontFamily:'Arial,sans-serif', display:'flex' }}>joystick-log.com</span>
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.2)', fontFamily:'Arial,sans-serif', display:'flex' }}>Note & critique ce jeu →</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
