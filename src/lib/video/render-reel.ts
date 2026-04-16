import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { REMOTION_COMPOSITION_ID } from "@/lib/video/remotion-root";
import type { ReelCompositionProps } from "@/lib/video/remotion-composition";

export async function renderReelVideo(input: {
  props: ReelCompositionProps;
  outputFileName?: string;
}): Promise<{ filePath: string }> {
  const entryPoint = path.join(process.cwd(), "src", "lib", "video", "remotion-root.tsx");
  const bundleLocation = await bundle({
    entryPoint,
    onProgress: () => undefined
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: REMOTION_COMPOSITION_ID,
    inputProps: input.props
  });

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "reelshopee-render-"));
  const outputPath = path.join(tempDir, input.outputFileName ?? `reel-${Date.now()}.mp4`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: input.props,
    chromiumOptions: {
      disableWebSecurity: true
    },
    onProgress: () => undefined
  });

  return {
    filePath: outputPath
  };
}
