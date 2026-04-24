"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {status === "idle" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Criar Novo Reel</CardTitle>
                <p className="text-slate-500">Envie uma foto do seu produto da Shopee</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <UploadDropzone onUpload={handleUpload} />
                
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    PNG, JPG, WebP
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Max 10MB
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it Works Card */}
            <Card className="shadow-lg border-0">
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <CardTitle className="text-2xl">Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { step: 1, title: "Envie a foto", desc: "Tire um print ou foto do produto na Shopee", color: "bg-violet-500" },
                  { step: 2, title: "IA analisa", desc: "Extrai nome, preço e benefícios automaticamente", color: "bg-purple-500" },
                  { step: 3, title: "Reel gerado", desc: "Capa, script, texto e música trending", color: "bg-pink-500" },
                  { step: 4, title: "Baixe e poste", desc: "Publique diretamente no Instagram", color: "bg-orange-500" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0`}>
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {status !== "idle" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Status Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className={`h-2 ${status === "ready" ? "bg-gradient-to-r from-green-500 to-emerald-500" : status === "error" ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  {status === "uploading" && <span className="text-2xl">📤</span>}
                  {status === "analyzing" && <span className="text-2xl">🔍</span>}
                  {status === "generating" && <span className="text-2xl">⚡</span>}
                  {status === "ready" && <span className="text-2xl">✅</span>}
                  {status === "error" && <span className="text-2xl">❌</span>}
                  {status === "uploading" && "Enviando imagem..."}
                  {status === "analyzing" && "Analisando produto..."}
                  {status === "generating" && "Gerando Reel..."}
                  {status === "ready" && "Reel Pronto!"}
                  {status === "error" && "Erro"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {status === "ready" && analysis && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 space-y-3">
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-lg">📦</span> Dados extraídos
                    </p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Produto:</span> {analysis.productName}</p>
                      <p><span className="font-medium">Preço:</span> <span className="text-green-600 font-bold">R$ {analysis.productPrice.toFixed(2)}</span></p>
                      <p><span className="font-medium">Descrição:</span> {analysis.shortDescription}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleReset} variant="outline" className="flex-1 rounded-full">
                    Criar Outro
                  </Button>
                  {status === "ready" && (
                    <Button className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700">
                      Baixar Reel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Preview do Reel</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <ReelPreview
                  thumbnailUrl={previewUrl || undefined}
                  hookText={reelData?.hookText || "Carregando..."}
                  caption={reelData?.caption}
                  videoUrl={reelData?.videoUrl}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-slate-400">
        <p>ReelFlow © 2024 - Crie Reels profissionais em segundos</p>
      </footer>
    </div>
  );
}