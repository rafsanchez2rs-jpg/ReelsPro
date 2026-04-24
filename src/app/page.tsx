"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadDropzone } from "@/components/reels/upload-dropzone";
import { ReelPreview } from "@/components/reels/reel-preview";
import { Progress } from "@/components/ui/progress";

type GenerationStatus = "idle" | "uploading" | "analyzing" | "generating" | "ready" | "error";

interface ProductAnalysis {
  productName: string;
  productPrice: number;
  shortDescription: string;
  benefits: string[];
}

export default function HomePage() {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [reelData, setReelData] = useState<{
    hookText: string;
    caption: string;
    narrationScript: string;
    videoUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (uploadedFile: File) => {
    setError(null);
    setStatus("uploading");
    setProgress(10);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(uploadedFile);

    setTimeout(() => {
      setStatus("analyzing");
      setProgress(30);

      setTimeout(() => {
        setStatus("generating");
        setProgress(70);

        setTimeout(() => {
          setAnalysis({
            productName: "Produto Exemplo",
            productPrice: 99.90,
            shortDescription: "Descrição automática do produto",
            benefits: ["Benefício 1", "Benefício 2", "Benefício 3"]
          });

          setReelData({
            hookText: "Você não vai acreditar! 🔥",
            caption: "Produto incrível com desconto!",
            narrationScript: "Olha só esse produto incrível. Compre agora!",
          });

          setStatus("ready");
          setProgress(100);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setPreviewUrl(null);
    setAnalysis(null);
    setReelData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header simplificado */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                ReelFlow
              </h1>
              <p className="text-xs text-slate-500">Crie Reels em segundos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            Configurações
          </Button>
        </div>
      </header>

      {/* Conteúdo principal com layout em grid */}
      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-2 gap-6">
        {/* Upload + instruções (esquerda) */}
        <section className="space-y-4">
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Criar Novo Reel</CardTitle>
              <CardDescription>Envie uma foto do seu produto</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <UploadDropzone onUpload={handleUpload} />
              <div className="mt-4">
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Preview + dados (direita) */}
        <section className="space-y-4">
          <Card className="shadow">
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent className="p-4">
              <ReelPreview thumbnailUrl={previewUrl ?? undefined} hookText={reelData?.hookText ?? ""} caption={reelData?.caption ?? ""} videoUrl={undefined} />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}