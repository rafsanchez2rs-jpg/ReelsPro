"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createReelFromUploadAction,
  REEL_EDITOR_INITIAL_STATE,
  REEL_GENERATION_INITIAL_STATE,
  renderReelAssetsAction,
  saveReelDraftAction,
  type ReelEditorActionState,
  type ReelGenerationActionState
} from "@/actions/reels.actions";
import { ReelEditorTimeline, type OverlayDraft } from "@/components/reels/reel-editor-timeline";
import { UploadDropzone } from "@/components/reels/upload-dropzone";
import { ReelPreview } from "@/components/reels/reel-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_EDITOR_STATE: ReelEditorActionState = REEL_EDITOR_INITIAL_STATE;

export function ReelGeneratorPanel() {
  const [state, formAction, isPending] = useActionState<ReelGenerationActionState, FormData>(
    createReelFromUploadAction,
    REEL_GENERATION_INITIAL_STATE
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hookText, setHookText] = useState("");
  const [caption, setCaption] = useState("");
  const [narrationScript, setNarrationScript] = useState("");
  const [thumbnailHeadline, setThumbnailHeadline] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<"elevenlabs" | "cartesia">("elevenlabs");
  const [voiceId, setVoiceId] = useState("pt-br-feminina-comercial-01");
  const [narrationSpeed, setNarrationSpeed] = useState("1");
  const [overlays, setOverlays] = useState<OverlayDraft[]>([]);

  useEffect(() => {
    if (!state.draft) return;

    setHookText(state.draft.hookText);
    setCaption(state.draft.caption);
    setNarrationScript(state.draft.narrationScript);
    setThumbnailHeadline(state.draft.thumbnailHeadline);
    setOverlays(state.draft.overlays);
  }, [state.draft]);

  const overlaysJson = useMemo(() => JSON.stringify(overlays), [overlays]);

  const preview = useMemo(() => {
    const draft = state.draft;

    return {
      hookText: hookText || draft?.hookText || "",
      caption: caption || draft?.caption || "",
      narrationScript: narrationScript || draft?.narrationScript || "",
      thumbnailHeadline: thumbnailHeadline || draft?.thumbnailHeadline || "",
      overlays: overlays.length > 0 ? overlays : draft?.overlays ?? []
    };
  }, [state.draft, hookText, caption, narrationScript, thumbnailHeadline, overlays]);

  const isEditorReady = Boolean(state.reelId && state.draft);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Upload e Geracao</h2>
          <p className="mt-1 text-sm text-slate-600">
            Envie um print da Shopee e gere automaticamente thumbnail, overlays e roteiro de narracao.
          </p>
        </div>

        <form onSubmit={formAction} className="space-y-4">
          <UploadDropzone
            onFileChange={(payload: any) =>
              setSelectedFile((prev: File | null) => (typeof payload === "function" ? payload(prev) : (payload as File | null)))
            }
            onUpload={() => {
              // noop durante a geração de draft; o upload real acontece ao submeter o formulário
            }}
            disabled={isPending}
          />

          <Button type="submit" disabled={isPending || !selectedFile}>
            {isPending ? "Gerando draft..." : "Gerar Reel"}
          </Button>
        </form>

        {state.message ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        {isEditorReady ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Editor avançado do Reel</h3>

            <div>
              <Label htmlFor="hookText">Hook</Label>
              <Input id="hookText" value={hookText} onChange={(event) => setHookText(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="thumbnailHeadline">Frase da capa</Label>
              <Input
                id="thumbnailHeadline"
                value={thumbnailHeadline}
                onChange={(event) => setThumbnailHeadline(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="caption">Legenda</Label>
              <Textarea id="caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
            </div>

            <div>
              <Label htmlFor="narrationScript">Roteiro de narracao</Label>
              <Textarea
                id="narrationScript"
                value={narrationScript}
                onChange={(event) => setNarrationScript(event.target.value)}
                className="min-h-32"
              />
            </div>

            <ReelEditorTimeline overlays={overlays} onChange={setOverlays} />

            {/* Nível básico: salvar e renderizar podem ser adicionados aqui se necessários */}

          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        <ReelPreview imageUrl={state.imageUrl} hookText={preview.hookText} caption={preview.caption} thumbnailHeadline={preview.thumbnailHeadline} overlays={preview.overlays} />

        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Dados extraidos</h3>
          {state.analysis ? (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Produto:</span> {state.analysis.productName}</p>
              <p><span className="font-semibold">Preco:</span> R$ {state.analysis.price.toFixed(2).replace(".", ",")}</p>
              <p><span className="font-semibold">Descricao:</span> {state.analysis.description}</p>
              <p><span className="font-semibold">Beneficios:</span> {state.analysis.benefits.join(" | ")}</p>
              <p><span className="font-semibold">Confianca:</span> {(state.analysis.confidence * 100).toFixed(0)}%</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Aguardando upload para analisar produto.</p>
          )}
        </Card>
      </div>
    </div>
  );
}