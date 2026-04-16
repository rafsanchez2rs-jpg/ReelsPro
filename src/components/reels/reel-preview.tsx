"use client";

interface OverlayPreview {
  sequence: number;
  text: string;
  animation: string;
  startMs: number;
  endMs: number;
}

interface ReelPreviewProps {
  imageUrl?: string;
  hookText: string;
  caption: string;
  thumbnailHeadline: string;
  overlays: OverlayPreview[];
}

export function ReelPreview({ imageUrl, hookText, caption, thumbnailHeadline, overlays }: ReelPreviewProps) {
  const visibleOverlays = overlays.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
          <div className="relative h-full w-full">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Produto" className="h-full w-full object-cover opacity-80" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs text-slate-300">
                Preview aparecera aqui
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/55" />

            <div className="absolute left-3 right-3 top-3 rounded-lg bg-black/60 px-2 py-1.5 text-center text-[11px] font-semibold text-white">
              {thumbnailHeadline || "Capa do Reel"}
            </div>

            <div className="absolute left-3 right-3 bottom-4 space-y-1.5">
              {visibleOverlays.map((overlay) => (
                <div
                  key={overlay.sequence}
                  className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold text-slate-900 shadow-sm"
                >
                  {overlay.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hook</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{hookText || "Hook do video"}</p>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Legenda</p>
        <p className="mt-1 line-clamp-3 text-sm text-slate-700">{caption || "Legenda do post"}</p>
      </div>
    </div>
  );
}
