"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReelPreviewProps {
  hookText?: string;
  caption?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  overlays?: Array<{ text: string; startMs: number; endMs: number }>;
}

export function ReelPreview({
  hookText = "Olha só esse produto!",
  caption,
  thumbnailUrl,
  videoUrl,
  overlays = []
}: ReelPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-xl bg-black mx-auto">
      {thumbnailUrl && !isPlaying && (
        <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
      )}

      {videoUrl && (
  <video
    src={videoUrl}
    className="h-full w-full object-cover"
    onPlay={() => setIsPlaying(true)}
    onEnded={() => setIsPlaying(false)}
    controls={false}
  />
)}

      {isPlaying && overlays.map((overlay, idx) => (
        <div
          key={idx}
          className="absolute left-1/2 -translate-x-1/2 text-white text-center px-4 py-2 bg-black/50 rounded-lg"
          style={{ bottom: `${20 + idx * 15}%` }}
        >
          <p className="text-lg font-bold">{overlay.text}</p>
        </div>
      ))}

      {!isPlaying && hookText && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center px-4">
          <p className="text-xl font-bold text-white drop-shadow-lg">{hookText}</p>
        </div>
      )}

      {caption && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <p className="text-xs text-white/80 text-center line-clamp-2">{caption}</p>
        </div>
      )}

      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        <button
          onClick={() => !isPlaying && videoUrl && setIsPlaying(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}