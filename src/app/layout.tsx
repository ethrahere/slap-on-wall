import type { Metadata } from "next";
import { Inter, Kalam, Quicksand } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shefi-sans",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-shefi-heading",
  weight: ["400", "500", "600", "700"],
});

const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-shefi-handwriting",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "SheFi Wall ✨ | Where queens leave their marks",
  description:
    "Slap a virtual post-it on the SheFi Wall and share your wins, confessions, and chaotic tea with the community in real time.",
    openGraph: {
      title: "SheFi Wall ✨ | Where queens leave their marks",
      description: "Slap a virtual post-it on the SheFi Wall and share your wins, confessions, and chaotic tea with the community in real time.",
      images: [
        {
          url: "https://slap-on-wall.vercel.app/splash.png",
          width: 1200,
          height: 630,
          alt: "Slap-it",
        },
      ],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: "https://slap-on-wall.vercel.app/splash.png",
        button: {
          title: "Open Slap-it",
          action: {
            type: "launch",
            name: "Slap-it",
            url: "https://slap-on-wall.vercel.app",
            splashImageUrl: "https://slap-on-wall.vercel.app/icon.png",
            splashBackgroundColor: "#8B5CF6",
          },
        },
      }),
      "fc:frame": JSON.stringify({
        version: "1",
        imageUrl: "https://slap-on-wall.vercel.app/splash.png",
        button: {
          title: "Open Slap-it",
          action: {
            type: "launch",
            name: "Slap-it",
            url: "https://slap-on-wall.vercel.app",
            splashImageUrl: "https://slap-on-wall.vercel.app/icon.png",
            splashBackgroundColor: "#8B5CF6",
          },
        },
      }),
    }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-wall">
      <body
        className={`${inter.variable} ${quicksand.variable} ${kalam.variable} antialiased bg-wall text-shefi-ink`}
      >
        {children}
      </body>
    </html>
  );
}
