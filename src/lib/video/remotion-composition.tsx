import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface ReelOverlayInput {
  sequence: number;
  text: string;
  animation: string;
  startMs: number;
  endMs: number;
}

export type ReelCompositionProps = {
  productImageUrl: string;
  thumbnailHeadline: string;
  hookText: string;
  caption: string;
  overlays: ReelOverlayInput[];
  narrationAudioUrl?: string;
  durationSeconds: number;
};

function OverlayBlock({ text, startFrame, endFrame }: { text: string; startFrame: number; endFrame: number }) {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  const progress = spring({
    frame: frame - startFrame,
    fps: 30,
    config: {
      damping: 12,
      stiffness: 100
    }
  });

  const translateY = interpolate(progress, [0, 1], [24, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        alignSelf: "center",
        maxWidth: "86%",
        backgroundColor: "rgba(255,255,255,0.93)",
        borderRadius: 14,
        padding: "14px 16px",
        fontSize: 42,
        fontWeight: 800,
        color: "#0f172a",
        textAlign: "center",
        boxShadow: "0 8px 26px rgba(2,6,23,.22)"
      }}
    >
      {text}
    </div>
  );
}

export function ReelComposition(props: ReelCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayRows = props.overlays
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((overlay) => (
      <OverlayBlock
        key={`${overlay.sequence}-${overlay.startMs}`}
        text={overlay.text}
        startFrame={Math.floor((overlay.startMs / 1000) * fps)}
        endFrame={Math.floor((overlay.endMs / 1000) * fps)}
      />
    ));

  const vignetteOpacity = interpolate(frame, [0, 20], [0.2, 0.45], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", fontFamily: "Aptos, Segoe UI, sans-serif" }}>
      <Img src={props.productImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(2,6,23,${vignetteOpacity}) 0%, rgba(2,6,23,0.15) 35%, rgba(2,6,23,0.75) 100%)`
        }}
      />

      <AbsoluteFill style={{ padding: 42, justifyContent: "space-between" }}>
        <div
          style={{
            alignSelf: "center",
            marginTop: 8,
            maxWidth: "92%",
            borderRadius: 18,
            backgroundColor: "rgba(2,132,199,.88)",
            border: "2px solid rgba(255,255,255,.26)",
            padding: "14px 18px",
            color: "#fff",
            fontSize: 38,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.14
          }}
        >
          {props.thumbnailHeadline}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 120 }}>{overlayRows}</div>

        <div
          style={{
            borderRadius: 16,
            backgroundColor: "rgba(15,23,42,.78)",
            border: "1px solid rgba(255,255,255,.2)",
            padding: "14px 16px",
            color: "#fff",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.25
          }}
        >
          {props.hookText}
        </div>
      </AbsoluteFill>

      {props.narrationAudioUrl ? (
        <Sequence from={0}>
          <Audio src={props.narrationAudioUrl} volume={0.95} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
}
