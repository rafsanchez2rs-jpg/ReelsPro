import { ReelGeneratorPanel } from "@/components/reels/reel-generator-panel";

export default function UploadPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Gerador de Reel Shopee</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload de imagem + analise inteligente + draft completo para Instagram Reel em poucos segundos.
        </p>
      </header>

      <ReelGeneratorPanel />
    </section>
  );
}
