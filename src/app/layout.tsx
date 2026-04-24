"use client";

import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ReelFlow - Crie Reels automaticamente",
  description: "Crie Reels profissionais para Instagram automaticamente a partir de fotos de produtos Shopee"
};

// Cabeçalho simples e bonito
const Header = () => (
  <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-pink-600" />
        <span className="font-semibold text-xl">ReelFlow</span>
      </div>
      <nav className="text-sm text-slate-500">Configurações</nav>
    </div>
  </header>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-slate-900">
        <Header />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}