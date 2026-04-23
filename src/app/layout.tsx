import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ReelFlow - Crie Reels automatically",
  description: "Crie Reels profissionais para Instagram automaticamente a partir de fotos de produtos Shopee"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}