# ReelsPro Development & Testing

## Dev Server
```bash
npm run dev
```
Runs on `http://localhost:3000` with Turbopack.

## Lint & Typecheck
```bash
npm run lint
npx tsc --noEmit
```

## Key Architecture
- **Frontend**: `src/app/page.tsx` — upload dropzone, status states (idle/uploading/analyzing/generating/ready/error), displays AI-generated data
- **API Route**: `src/app/api/reels/generate/route.ts` — accepts `imageUrl` + `userId`, calls Gemini/Groq for product analysis + script generation
- **Video Rendering**: `src/lib/video/render-reel.ts` — Remotion-based MP4 rendering (graceful fallback if unavailable)
- **AI Libs**: `src/lib/ai/gemini.ts`, `src/lib/ai/groq.ts` — product analysis providers

## Testing the E2E Flow
1. Upload a product image via the dropzone
2. Observe status progression: Enviando → Analisando → Gerando Reel → Reel Pronto!
3. Verify "Dados Extraídos" shows product name + price
4. Verify "Roteiro Gerado" shows hook, caption, narration, hashtags
5. Click "Baixar Reel" — should trigger file download with `reel-*.mp4` filename
6. Click "Criar Outro" — should reset to idle state

## Error State Testing
- Block `/api/reels/generate` in Chrome DevTools Network request blocking
- Upload an image → error state should appear with "Tentar Novamente" button
- Click retry → page resets to idle

## Anonymous Mode
When `userId` is `"anonymous"`, the API skips Supabase persistence. This allows testing without authentication setup.

## Turbopack Compatibility
Remotion/esbuild packages must be listed in `serverExternalPackages` in `next.config.ts` to prevent Turbopack from bundling them (they contain `.md` files that Turbopack can't process):
```ts
serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "@remotion/cli", "esbuild"]
```

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- At least one AI key: `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini) or `GROQ_API_KEY`
- Optional: `SUPABASE_SERVICE_ROLE_KEY` (for authenticated persistence)
