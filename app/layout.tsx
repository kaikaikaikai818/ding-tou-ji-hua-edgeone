import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "定投计划",
  description: "只告诉你什么时候投、投多少，以及现在有多少。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
