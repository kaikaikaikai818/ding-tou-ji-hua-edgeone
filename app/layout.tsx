import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "定投计划",
  description: "只告诉你什么时候投、投多少，以及现在有多少。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${basePath}/icon-192.png`,
    shortcut: `${basePath}/icon-192.png`,
    apple: `${basePath}/icon-192.png`,
  },
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "定投计划",
    statusBarStyle: "default",
  },
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
