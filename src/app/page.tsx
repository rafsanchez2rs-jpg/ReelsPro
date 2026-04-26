"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadDropzone } from "@/components/reels/upload-dropzone";
import { ReelPreview } from "@/components/reels/reel-preview";
import { Progress } from "@/components/ui/progress";

type GenerationStatus = "idle" | "uploading" | "analyzing" | "generating" | "ready" | "error";

interface ReelData {
  hookText: string;
  caption: string;
  narration: string;
  hashtags: string[];
  thumbnailUrl: string;
  videoUrl?: string;
  analysis: {
    productName: string;
    productPrice: number;
    shortDescription: string;
    benefits: string[];
  };
}

export default function HomePage() {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reelData, setReelData] = useState<ReelData | null>(null);

  const handleUpload = async (uploadedFile: File) => {
    setStatus("uploading");
    setProgress(10);
    setReelData(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(uploadedFile);

    const imageUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target?.result as string);
      r.readAsDataURL(uploadedFile);
    });

    try {
      setStatus("analyzing");
      setProgress(30);

      const response = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          userId: "anonymous",
        }),
      });

      setStatus("generating");
      setProgress(70);

      const data = await response.json();

      if (data.success) {
        setReelData(data.reel);
        setStatus("ready");
        setProgress(100);
      } else {
        console.error("API error:", data.error);
        setStatus("error");
      }
    } catch (error) {
      console.error("Erro:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setPreviewUrl(null);
    setReelData(null);
  };

  const handleDownload = () => {
    const downloadUrl = reelData?.videoUrl || reelData?.thumbnailUrl;
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `reel-${Date.now()}.mp4`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400">
              <span className="text-lg font-black text-white">R</span>
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-black text-transparent">
              ReelFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              Máximo 5 usuários
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {status === "idle" && (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-400 bg-clip-text text-5xl font-black text-transparent">
                Crie Reels Profissionais em Segundos
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Transforme fotos de produtos da Shopee em Reels virais para Instagram usando Inteligência Artificial
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                      📸
                    </div>
                    <h2 className="text-2xl font-bold">Criar Novo Reel</h2>
                  </div>
                  <UploadDropzone onUpload={handleUpload} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-bold">Como Funciona</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, icon: "📸", title: "Envie a foto", desc: "Print ou foto do produto Shopee" },
                      { step: 2, icon: "🤖", title: "IA Analisa", desc: "Extrai dados automaticamente" },
                      { step: 3, icon: "✨", title: "Reel Gerado", desc: "Pronto em segundos" },
                      { step: 4, icon: "🚀", title: "Publique", desc: "No Instagram" }
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-bold">Modo Gratuito Ativo</h3>
                  <div className="space-y-3">
                    {[
                      { icon: "🧠", title: "Groq + Llama", desc: "Ultra-rápido" },
                      { icon: "🎨", title: "Gemini Flash", desc: "Visão IA" },
                      { icon: "🎬", title: "Flux", desc: "Thumbnails" }
                    ].map((item, idx) => (
                      <div key={idx} className="rounded-xl bg-gradient-to-br from-gray-50 to-pink-50 p-4 text-center">
                        <div className="mb-2 text-3xl">{item.icon}</div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <div className="mx-auto max-w-4xl">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="mb-2 text-2xl font-bold">
                  {status === "uploading" && "📤 Enviando..."}
                  {status === "analyzing" && "🧠 Analisando..."}
                  {status === "generating" && "✨ Gerando Reel..."}
                  {status === "ready" && "🎉 Reel Pronto!"}
                  {status === "error" && "❌ Erro"}
                </h2>
                
                {status !== "error" && (
                  <>
                    <Progress value={progress} className="mb-6 h-3" />
                    <p className="mb-6 text-center text-gray-600">{progress}%</p>
                  </>
                )}

                {status === "error" && (
                  <div className="text-center space-y-4 py-6">
                    <p className="text-red-500 font-semibold">
                      Erro ao gerar o reel. Tente novamente.
                    </p>
                    <Button onClick={handleReset} variant="outline">
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {status === "ready" && reelData && (
                  <div className="space-y-6">
                    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-pink-50 p-6">
                      <p className="font-semibold mb-2">Dados Extraídos:</p>
                      <p className="text-sm">
                        Produto: <strong>{reelData.analysis.productName}</strong>
                      </p>
                      <p className="text-sm">
                        Preço:{" "}
                        <strong className="text-green-600">
                          {reelData.analysis.productPrice.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </strong>
                      </p>
                      <p className="text-sm mt-1">
                        {reelData.analysis.shortDescription}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 space-y-3">
                      <p className="font-semibold">Roteiro Gerado:</p>
                      <p className="text-sm">
                        <span className="font-medium">Hook:</span> {reelData.hookText}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Caption:</span> {reelData.caption}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Narração:</span> {reelData.narration}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {reelData.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleReset} variant="outline" className="flex-1">
                        Criar Outro
                      </Button>
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        ⬇️ Baixar Reel
                      </Button>
                    </div>
                  </div>
                )}

                {previewUrl && status !== "error" && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-bold">Preview</h3>
                    <div className="mx-auto max-w-[280px]">
                      <ReelPreview
                        thumbnailUrl={reelData?.thumbnailUrl || previewUrl}
                        hookText={reelData?.hookText}
                        caption={reelData?.caption}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
