import { z } from "zod";

export const uploadProductSchema = z.object({
  filename: z.string().min(3),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024)
});

export const generatedOverlaySchema = z.object({
  sequence: z.number().int().min(1),
  text: z.string().min(2).max(80),
  animation: z.string().min(2).max(30),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(1)
});

export const visionOutputSchema = z.object({
  productName: z.string().min(2),
  price: z.number().nonnegative(),
  description: z.string().min(10),
  benefits: z.array(z.string().min(2)).min(2).max(6),
  attributes: z.record(z.string(), z.string()).default({}),
  confidence: z.number().min(0).max(1).default(0.8)
});

export const reelDraftSchema = z.object({
  title: z.string().min(4),
  hookText: z.string().min(5),
  caption: z.string().min(10),
  narrationScript: z.string().min(20),
  durationSeconds: z.number().int().min(15).max(30),
  hashtags: z.array(z.string()).min(3),
  overlays: z.array(generatedOverlaySchema).min(2).max(6),
  trendingAudioLabel: z.string().min(2)
});
