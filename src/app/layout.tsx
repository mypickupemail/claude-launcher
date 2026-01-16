import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SoundProvider } from "@/components/SoundProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Claude Launcher",
  description: "Launch Claude Code terminals in your projects",
  icons: {
    icon: [
      { url: '/favicon-16.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon-32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-48.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-64.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/favicon-128.ico', sizes: '128x128', type: 'image/x-icon' },
      { url: '/favicon-256.ico', sizes: '256x256', type: 'image/x-icon' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
