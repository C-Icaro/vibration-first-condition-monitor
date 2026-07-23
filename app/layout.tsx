import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Edge Condition Monitor",
  description: "Interface operacional mockada para monitoramento de condição vibration-first.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080a0c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
