"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface OverlayDraft {
  sequence: number;
  text: string;
  animation: string;
  startMs: number;
  endMs: number;
}

interface ReelEditorTimelineProps {
  overlays: OverlayDraft[];
  onChange: (next: OverlayDraft[]) => void;
}

export function ReelEditorTimeline({ overlays, onChange }: ReelEditorTimelineProps) {
  const updateAt = (index: number, patch: Partial<OverlayDraft>) => {
    const next = overlays.map((overlay, currentIndex) =>
      currentIndex === index
        ? {
            ...overlay,
            ...patch
          }
        : overlay
    );

    onChange(next);
  };

  const addOverlay = () => {
    const last = overlays[overlays.length - 1];
    const nextStart = last ? last.endMs : 0;
    const next: OverlayDraft = {
      sequence: overlays.length + 1,
      text: "Nova frase",
      animation: "slide-up",
      startMs: nextStart,
      endMs: nextStart + 3000
    };

    onChange([...overlays, next]);
  };

  const removeOverlay = (index: number) => {
    const filtered = overlays.filter((_, currentIndex) => currentIndex !== index).map((overlay, idx) => ({
      ...overlay,
      sequence: idx + 1
    }));

    onChange(filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Timeline de overlays</Label>
        <Button type="button" variant="outline" onClick={addOverlay}>
          Adicionar overlay
        </Button>
      </div>

      {overlays.map((overlay, index) => (
        <div key={`${overlay.sequence}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overlay {overlay.sequence}</p>
            <Button type="button" variant="ghost" onClick={() => removeOverlay(index)}>
              Remover
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={overlay.text}
              onChange={(event) => updateAt(index, { text: event.target.value })}
              placeholder="Texto da overlay"
            />
            <Input
              value={overlay.animation}
              onChange={(event) => updateAt(index, { animation: event.target.value })}
              placeholder="Animacao"
            />
            <Input
              type="number"
              value={overlay.startMs}
              onChange={(event) => updateAt(index, { startMs: Number(event.target.value) })}
              placeholder="Inicio (ms)"
            />
            <Input
              type="number"
              value={overlay.endMs}
              onChange={(event) => updateAt(index, { endMs: Number(event.target.value) })}
              placeholder="Fim (ms)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
