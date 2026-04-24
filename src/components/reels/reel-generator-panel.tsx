"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createReelFromUploadAction,
  REEL_EDITOR_INITIAL_STATE,
  REEL_GENERATION_INITIAL_STATE,
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
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [thumbnailHeadline, setThumbnailHeadline] = useState("");
  const [overlays, setOverlays] = useState<OverlayDraft[]>([]);

  useEffect(() => {
    if (!state.draft) return;
    setHookText(state.draft.hookText);
    setCaption(state.draft.caption);
    setNarrationScript(state.draft.narrationScript);
    setThumbnailHeadline(state.draft.thumbnailHeadline);
    // overlays do state.draft
  }, [state.draft]);

  const overlaysJson = useMemo(() => JSON.stringify(overlays), [overlays]);

  const preview = useMemo(() => {
    const draft = state.draft;
    return {
      hookText: hookText || draft?.hookText || "",
      caption: caption || draft?.caption || "",
      overlays: overlays.length > 0 ? overlays : draft?.overlays ?? []
    };
  }, [state.draft, hookText, caption, overlays]);

  const isEditorReady = Boolean(state.reelId && state.draft);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    formAction(fd as unknown as FormData);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Upload e Geracao</h2>
          <p className="mt-1 text-sm text-slate-600">Envie um print da Shopee e gere automaticamente thumbnail, overlays e roteiro.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <UploadDropzone
            onFileChange={(payload: any) =>
              setSelectedFile((prev: File | null) => (typeof payload === "function" ? payload(prev) : (payload as File | null)))
            }
            onUpload={() => {}}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !selectedFile}>Gerar Reel</Button>
        </form>

        {state.message && (
          <div className={state.success ? "text-green-600" : "text-red-600"}>{state.message}</div>
        )}

        {isEditorReady && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Editor</h3>
            <div>
              <Label>Hook</Label>
              <Input value={hookText} onChange={(e) => setHookText(e.target.value)} />
            </div>
            <div>
              <Label>Frase da capa</Label>
              <Input value={thumbnailHeadline} onChange={(e) => setThumbnailHeadline(e.target.value)} />
            </div>
            <div>
              <Label>Legenda</Label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <div>
              <Label>Roteiro</Label>
              <Textarea value={narrationScript} onChange={(e) => setNarrationScript(e.target.value)} />
            </div>
            <ReelEditorTimeline overlays={overlays} onChange={setOverlays} />
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <ReelPreview
          thumbnailUrl={state.imageUrl}
          hookText={hookText}
          caption={caption}
          videoUrl={videoUrl}
          overlays={overlays.map((o) => ({ text: o.text, startMs: o.startMs, endMs: o.endMs }))}
        />
        <Card>
          <h3 className="font-semibold">Dados extraidos</h3>
          {state.analysis ? (
            <div className="text-sm mt-2">
              <p>Produto: {state.analysis.productName}</p>
              <p>Preço: {state.analysis.productPrice}</p>
              <p>Descrição: {state.analysis.shortDescription}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Aguardando upload...</p>
          )}
        </Card>
      </div>
    </div>
  );
}