import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ReelShopee Pro",
  description: "SaaS para gerar e publicar Reels automaticamente para vendedores Shopee"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
