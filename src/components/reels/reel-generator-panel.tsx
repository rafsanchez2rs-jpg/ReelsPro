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
import { PublishControls } from "@/components/reels/publish-controls";
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

  const [saveState, saveAction, savePending] = useActionState<ReelEditorActionState, FormData>(
    saveReelDraftAction,
    EMPTY_EDITOR_STATE
  );

  const [renderState, renderAction, renderPending] = useActionState<ReelEditorActionState, FormData>(
    renderReelAssetsAction,
    EMPTY_EDITOR_STATE
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

        <form action={formAction} className="space-y-4">
          <UploadDropzone onFileChange={setSelectedFile} disabled={isPending} />

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
            <h3 className="text-sm font-semibold text-slate-900">Editor avancado do Reel</h3>

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

            <form action={saveAction} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <input type="hidden" name="reelId" value={state.reelId ?? ""} />
              <input type="hidden" name="hookText" value={hookText} />
              <input type="hidden" name="caption" value={caption} />
              <input type="hidden" name="narrationScript" value={narrationScript} />
              <input type="hidden" name="thumbnailHeadline" value={thumbnailHeadline} />
              <input type="hidden" name="overlaysJson" value={overlaysJson} />

              <Button type="submit" variant="outline" disabled={savePending}>
                {savePending ? "Salvando..." : "Salvar como rascunho"}
              </Button>

              {saveState.message ? (
                <p className={`text-xs ${saveState.success ? "text-emerald-700" : "text-red-600"}`}>{saveState.message}</p>
              ) : null}
            </form>

            <form action={renderAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <input type="hidden" name="reelId" value={state.reelId ?? ""} />
              <input type="hidden" name="hookText" value={hookText} />
              <input type="hidden" name="caption" value={caption} />
              <input type="hidden" name="narrationScript" value={narrationScript} />
              <input type="hidden" name="thumbnailHeadline" value={thumbnailHeadline} />
              <input type="hidden" name="overlaysJson" value={overlaysJson} />

              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <Label htmlFor="voiceProvider">Provedor de voz</Label>
                  <select
                    id="voiceProvider"
                    name="voiceProvider"
                    value={voiceProvider}
                    onChange={(event) => setVoiceProvider(event.target.value as "elevenlabs" | "cartesia")}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="cartesia">Cartesia</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="voiceId">Voice ID</Label>
                  <Input id="voiceId" name="voiceId" value={voiceId} onChange={(event) => setVoiceId(event.target.value)} />
                </div>

                <div>
                  <Label htmlFor="narrationSpeed">Velocidade</Label>
                  <Input
                    id="narrationSpeed"
                    name="narrationSpeed"
                    value={narrationSpeed}
                    onChange={(event) => setNarrationSpeed(event.target.value)}
                    type="number"
                    step="0.1"
                  />
                </div>
              </div>

              <Button type="submit" disabled={renderPending}>
                {renderPending ? "Renderizando..." : "Renderizar video final"}
              </Button>

              {renderState.message ? (
                <p className={`text-xs ${renderState.success ? "text-emerald-700" : "text-red-600"}`}>{renderState.message}</p>
              ) : null}

              {renderState.videoSignedUrl ? (
                <a href={renderState.videoSignedUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
                  Abrir preview do video renderizado
                </a>
              ) : null}
            </form>
          </div>
        ) : null}

        {state.reelId && state.draft ? <PublishControls reelId={state.reelId} suggestedCaption={state.draft.caption} /> : null}
      </Card>

      <div className="space-y-4">
        <ReelPreview
          imageUrl={state.imageUrl}
          hookText={preview.hookText}
          caption={preview.caption}
          thumbnailHeadline={preview.thumbnailHeadline}
          overlays={preview.overlays}
        />

        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Dados extraidos</h3>
          {state.analysis ? (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Produto:</span> {state.analysis.productName}
              </p>
              <p>
                <span className="font-semibold">Preco:</span> R$ {state.analysis.price.toFixed(2).replace(".", ",")}
              </p>
              <p>
                <span className="font-semibold">Descricao:</span> {state.analysis.description}
              </p>
              <p>
                <span className="font-semibold">Beneficios:</span> {state.analysis.benefits.join(" | ")}
              </p>
              <p>
                <span className="font-semibold">Confianca:</span> {(state.analysis.confidence * 100).toFixed(0)}%
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Aguardando upload para analisar produto.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
