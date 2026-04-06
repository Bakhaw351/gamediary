export default function NotFound() {
  return (
    <html lang="fr">
      <head>
        <title>404 — JoystickLog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0;}
          body{background:#05060a;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;}
          .wrap{text-align:center;padding:40px 24px;}
          .num{font-family:'Syne',sans-serif;font-size:clamp(72px,15vw,120px);font-weight:800;line-height:1;background:linear-gradient(135deg,#ff6b35,#ffd166);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
          .title{font-size:18px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:12px;font-family:'Syne',sans-serif;}
          .desc{font-size:14px;color:rgba(255,255,255,.35);max-width:320px;margin:0 auto 40px;line-height:1.6;}
          .btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#ff6b35,#ffd166);color:#0d0e14;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;padding:13px 28px;border-radius:99px;text-decoration:none;letter-spacing:.3px;box-shadow:0 0 32px rgba(255,107,53,.4);transition:box-shadow .2s,transform .2s;}
          .btn:hover{box-shadow:0 0 52px rgba(255,107,53,.7);transform:translateY(-1px);}
          .icon{margin-bottom:32px;}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="icon">
            <svg viewBox="0 0 120 80" width="120" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="14" width="112" height="52" rx="20" fill="#0d0e14" stroke="#ff6b35" strokeWidth="2.5"/>
              <line x1="38" y1="28" x2="38" y2="52" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round"/>
              <line x1="26" y1="40" x2="50" y2="40" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="80" cy="32" r="5" fill="#ffd166"/>
              <circle cx="94" cy="40" r="5" fill="#ff6b35"/>
              <circle cx="80" cy="48" r="5" fill="#a78bfa"/>
              <circle cx="66" cy="40" r="5" fill="#4ade80"/>
            </svg>
          </div>
          <div className="num">404</div>
          <div className="title">Page introuvable</div>
          <div className="desc">Cette page n'existe pas ou a été déplacée. Retourne au journal.</div>
          <a href="/" className="btn">← Retour à JoystickLog</a>
        </div>
      </body>
    </html>
  );
}
