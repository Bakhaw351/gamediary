import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "JoystickLog — Rate, review & track your games",
  description: "Millions of games, one app to catalog your gaming history. Rate, review and track every game you've played — from Game Boy to PS5.",
  keywords: ["video games", "game tracker", "game diary", "gaming log", "rate games", "game reviews"],
  authors: [{ name: "JoystickLog" }],
  metadataBase: new URL("https://joystick-log.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JoystickLog",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  openGraph: {
    title: "JoystickLog — Rate, review & track your games",
    description: "Millions of games, one app to catalog your gaming history. Rate, review and track every game you've played — from Game Boy to PS5.",
    url: "https://joystick-log.com",
    siteName: "JoystickLog",
    images: [
      {
        url: "/og-image",
        width: 1200,
        height: 630,
        alt: "JoystickLog — Your gaming diary",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JoystickLog — Rate, review & track your games",
    description: "Millions of games, one app to catalog your gaming history. Rate, review and track every game you've played.",
    images: ["/og-image"],
    creator: "@joysticklog",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/app/icon.svg", color: "#ff6b35" },
    ],
  },
};

export const viewport = {
  themeColor: "#ff6b35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JoystickLog" />
        <meta name="application-name" content="JoystickLog" />
        <meta name="msapplication-TileColor" content="#ff6b35" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
