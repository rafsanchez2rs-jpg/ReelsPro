"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [file, setFile] = useState<File | null>(null);
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
    setFile(uploadedFile);
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
            caption: "Produto incredibile com desconto!",
            narrationScript: "Olha só esse produto incrível. Compre agora!",
          });

          setStatus("ready");
          setProgress(100);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const handleDownload = () => {
    if (reelData?.videoUrl) {
      window.open(reelData.videoUrl, "_blank");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setReelData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">ReelFlow</h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-muted-foreground)]">Configurações</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {status === "idle" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Reel</CardTitle>
                <CardDescription>
                  Envie uma foto ou print do seu produto da Shopee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadDropzone onUpload={handleUpload} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Envie a foto do produto</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Tire um print ou foto do produto na Shopee
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium">IA analisa automaticamente</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Extrai nome, preço e benefícios
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Reel pronto em segundos</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Capa, script, texto e música trending
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Baixe e poste</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Publique diretamente no Instagram
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {status !== "idle" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {status === "uploading" && "Enviando imagem..."}
                  {status === "analyzing" && "Analisando produto..."}
                  {status === "generating" && "Gerando Reel..."}
                  {status === "ready" && "Reel Pronto!"}
                  {status === "error" && "Erro"}
                </CardTitle>
                <CardDescription>
                  {status === "ready" ? "Seu Reel está pronto para baixar" : "Aguarde enquanto processamos"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                <p className="text-center text-sm text-[var(--color-muted-foreground)]">
                  {progress}%
                </p>

                {status === "ready" && (
                  <>
                    <div className="rounded-lg bg-[var(--color-muted)] p-4">
                      <p className="text-sm font-medium">Dados extraídos:</p>
                      {analysis && (
                        <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-muted-foreground)]">
                          <li><strong>Produto:</strong> {analysis.productName}</li>
                          <li><strong>Preço:</strong> R$ {analysis.productPrice.toFixed(2)}</li>
                          <li><strong>Descrição:</strong> {analysis.shortDescription}</li>
                        </ul>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleReset} variant="outline" className="flex-1">
                        Criar Outro
                      </Button>
                      <Button onClick={handleDownload} className="flex-1">
                        Baixar Reel
                      </Button>
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ReelPreview
                  thumbnailUrl={previewUrl || undefined}
                  hookText={reelData?.hookText}
                  caption={reelData?.caption}
                  videoUrl={reelData?.videoUrl}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}