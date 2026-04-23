interface ThumbnailGenerationOptions {
  productName: string;
  brandColor: string;
  accentPhrase?: string;
  style?: "modern" | "bold" | "minimal";
}

interface GeneratedThumbnail {
  imageUrl: string;
  prompt: string;
}

export async function generateThumbnail(options: ThumbnailGenerationOptions): Promise<GeneratedThumbnail> {
  const { serverEnv } = await import("@/lib/env");

  if (serverEnv.FLUX_API_KEY) {
    return generateWithFlux(options);
  }

  return getMockThumbnail(options);
}

async function generateWithFlux(options: ThumbnailGenerationOptions): Promise<GeneratedThumbnail> {
  const { serverEnv } = await import("@/lib/env");

  const prompt = `Instagram thumbnail, product showcase, ${options.productName}, ${options.accentPhrase || "limited time offer"}, ${options.style || "modern"} style, vibrant ${options.brandColor} accent, high contrast text overlay, trending on Instagram, professional product photography, 9:16 aspect ratio, eye-catching design`;

  const response = await fetch("https://api.bfl.dev/v1/generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.FLUX_API_KEY}`
    },
    body: JSON.stringify({
      prompt,
      width: 1080,
      height: 1920,
      num_steps: 25,
      guidance: 7.5
    })
  });

  const data = await response.json();

  if (data.image) {
    return {
      imageUrl: `data:image/png;base64,${data.image}`,
      prompt
    };
  }

  return getMockThumbnail(options);
}

function getMockThumbnail(options: ThumbnailGenerationOptions): GeneratedThumbnail {
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect fill="${options.brandColor}" width="1080" height="1920"/>
    <rect fill="rgba(0,0,0,0.3)" width="1080" height="960"/>
    <text x="540" y="960" text-anchor="middle" font-family="Arial" font-size="80" fill="white" font-weight="bold">${options.productName}</text>
    <text x="540" y="1400" text-anchor="middle" font-family="Arial" font-size="60" fill="white">${options.accentPhrase || "Limited Time!"}</text>
    <text x="540" y="1800" text-anchor="middle" font-family="Arial" font-size="50" fill="white">Available Now</text>
  </svg>`;

  const svgBase64 = Buffer.from(canvas).toString("base64");

  return {
    imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
    prompt: `Thumbnail for ${options.productName}`
  };
}