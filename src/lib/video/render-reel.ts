import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import type { ReelCompositionProps } from "./remotion-composition";
import { REMOTION_COMPOSITION_ID } from "./remotion-root";

export async function renderReel(props: ReelCompositionProps): Promise<Buffer> {
  const bundled = await bundle({
    entryPoint: path.resolve(process.cwd(), "src/lib/video/remotion-entry.tsx"),
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: REMOTION_COMPOSITION_ID,
    inputProps: props,
  });

  const outputPath = path.join("/tmp", `reel-${Date.now()}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
  });

  const buffer = fs.readFileSync(outputPath);

  try {
    fs.unlinkSync(outputPath);
  } catch {
    // cleanup best-effort
  }

  return buffer;
}
