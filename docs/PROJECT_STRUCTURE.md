# ReelShopee Pro - Estrutura de Pastas

## Árvore principal

```text
.
|-- package.json
|-- README.md
|-- docs/
|   `-- PROJECT_STRUCTURE.md
|-- public/
|   |-- fonts/
|   |-- icons/
|   `-- images/
|-- scripts/
|   |-- setup-dev.ts
|   `-- sync-instagram-metrics.ts
|-- src/
|   |-- actions/
|   |   |-- onboarding.actions.ts
|   |   |-- reels.actions.ts
|   |   |-- instagram.actions.ts
|   |   `-- billing.actions.ts
|   |-- app/
|   |   |-- (auth)/
|   |   |   |-- sign-in/page.tsx
|   |   |   `-- sign-up/page.tsx
|   |   |-- (dashboard)/
|   |   |   |-- layout.tsx
|   |   |   |-- onboarding/page.tsx
|   |   |   |-- upload/page.tsx
|   |   |   |-- reels/
|   |   |   |   |-- [reelId]/page.tsx
|   |   |   |   `-- editor/page.tsx
|   |   |   |-- metrics/page.tsx
|   |   |   |-- scheduler/page.tsx
|   |   |   `-- settings/page.tsx
|   |   |-- api/
|   |   |   |-- webhooks/
|   |   |   |   |-- stripe/route.ts
|   |   |   |   `-- instagram/route.ts
|   |   |   |-- instagram/
|   |   |   |   |-- publish/route.ts
|   |   |   |   |-- schedule/route.ts
|   |   |   |   `-- insights/route.ts
|   |   |   `-- reels/
|   |   |       `-- generate/route.ts
|   |   |-- layout.tsx
|   |   |-- globals.css
|   |   `-- page.tsx
|   |-- components/
|   |   |-- ui/ (shadcn/ui base)
|   |   |-- onboarding/
|   |   |   |-- onboarding-wizard.tsx
|   |   |   |-- step-account.tsx
|   |   |   |-- step-instagram.tsx
|   |   |   |-- step-brand.tsx
|   |   |   |-- step-voice.tsx
|   |   |   `-- step-plan.tsx
|   |   |-- reels/
|   |   |   |-- upload-dropzone.tsx
|   |   |   |-- reel-preview.tsx
|   |   |   |-- reel-editor-timeline.tsx
|   |   |   `-- publish-controls.tsx
|   |   `-- dashboard/
|   |       |-- kpi-cards.tsx
|   |       |-- engagement-chart.tsx
|   |       `-- reels-table.tsx
|   |-- hooks/
|   |   |-- use-tenant.ts
|   |   |-- use-onboarding.ts
|   |   `-- use-reel-generation.ts
|   |-- lib/
|   |   |-- env.ts
|   |   |-- utils.ts
|   |   |-- auth/
|   |   |   `-- permissions.ts
|   |   |-- supabase/
|   |   |   |-- client.ts
|   |   |   |-- server.ts
|   |   |   `-- admin.ts
|   |   |-- instagram/
|   |   |   |-- client.ts
|   |   |   |-- publish.ts
|   |   |   `-- insights.ts
|   |   |-- stripe/
|   |   |   |-- client.ts
|   |   |   `-- billing.ts
|   |   |-- vision/
|   |   |   `-- extract-product-data.ts
|   |   |-- voice/
|   |   |   |-- elevenlabs.ts
|   |   |   `-- cartesia.ts
|   |   |-- video/
|   |   |   |-- remotion-composition.tsx
|   |   |   |-- render-reel.ts
|   |   |   `-- thumbnail.ts
|   |   `-- validation/
|   |       |-- auth.schema.ts
|   |       |-- reel.schema.ts
|   |       `-- onboarding.schema.ts
|   |-- styles/
|   |   `-- tokens.css
|   |-- types/
|   |   |-- database.ts
|   |   |-- domain.ts
|   |   `-- api.ts
|   `-- middleware.ts
|-- supabase/
|   |-- config.toml
|   |-- schema.sql
|   |-- migrations/
|   `-- functions/
|       |-- generate-reel/
|       |-- sync-instagram-insights/
|       `-- stripe-webhook/
`-- tests/
    |-- e2e/
    |-- integration/
    `-- unit/
```

## Responsabilidade por pasta

- `src/app`: rotas e layouts com Next.js App Router.
- `src/actions`: Server Actions para onboarding, criação de reel, integração Instagram e billing.
- `src/components`: UI reutilizável; inclui blocos do shadcn/ui e módulos de negócio.
- `src/lib`: integrações externas (Supabase, Instagram, Stripe, OpenAI Vision, voz, vídeo).
- `src/hooks`: hooks de estado e orquestração de experiência.
- `src/types`: tipagem forte de domínio, banco e APIs.
- `supabase/schema.sql`: modelo de dados principal, RLS, funções SQL e triggers.
- `supabase/functions`: Edge Functions críticas (render, métricas, webhooks).
- `scripts`: automações de desenvolvimento e sincronização de dados.
- `tests`: testes unitários, integração e fluxo completo.
- `docs`: documentação técnica para facilitar manutenção, onboarding do time e futura white-label.

## Convenções de arquitetura

- Multi-tenant orientado a `tenant_id` em todas as entidades de negócio.
- Segurança por padrão com RLS ativa em toda tabela de dados do cliente.
- Segregação de responsabilidades:
  - geração de conteúdo (Vision + Script + TTS)
  - renderização de vídeo
  - publicação e métricas do Instagram
  - faturamento e limites de plano
- Código preparado para expansão white-label com branding e temas por tenant.
