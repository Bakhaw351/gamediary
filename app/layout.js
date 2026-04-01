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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
