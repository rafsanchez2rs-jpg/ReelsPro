import { reelDraftSchema, visionOutputSchema } from "@/lib/validation/reel.schema";

const ANALYSIS_SYSTEM_PROMPT = `
Voce e especialista em analise de produtos para e-commerce e criacao de criativos para Instagram Reels.
Extraia da imagem os campos abaixo em JSON valido:
- productName (string)
- price (number sem simbolo)
- description (string curta)
- benefits (array de 2 a 6 strings)
- attributes (objeto chave-valor)
- confidence (numero entre 0 e 1)
Use portugues brasileiro.
`;

interface VisionOutput {
  productName: string;
  price: number;
  description: string;
  benefits: string[];
  attributes: Record<string, string>;
  confidence: number;
}

interface ReelDraftOutput {
  title: string;
  hookText: string;
  caption: string;
  narrationScript: string;
  durationSeconds: number;
  hashtags: string[];
  overlays: Array<{
    sequence: number;
    text: string;
    animation: string;
    startMs: number;
    endMs: number;
  }>;
  trendingAudioLabel: string;
}

function fallbackVision(): VisionOutput {
  return {
    productName: "Produto Shopee em destaque",
    price: 99.9,
    description: "Produto com alta procura e excelente custo-beneficio.",
    benefits: [
      "Entrega rapida",
      "Qualidade premium",
      "Preco competitivo"
    ],
    attributes: {
      origem: "Shopee",
      categoria: "Nao identificada"
    },
    confidence: 0.65
  };
}

function buildReelDraft(analysis: VisionOutput): ReelDraftOutput {
  const benefitA = analysis.benefits[0] ?? "Qualidade superior";
  const benefitB = analysis.benefits[1] ?? "Preco competitivo";

  const draft = {
    title: `${analysis.productName} | Oferta de Hoje`,
    hookText: `Pare de perder dinheiro: ${analysis.productName} em promocao`,
    caption: `Achado da Shopee: ${analysis.productName} por R$ ${analysis.price
      .toFixed(2)
      .replace(".", ",")}. ${benefitA}. ${benefitB}. Link na bio.`,
    narrationScript: `Se voce busca ${analysis.productName}, olha essa oportunidade. Hoje ele esta por R$ ${analysis.price
      .toFixed(2)
      .replace(".", ",")}. Os principais beneficios sao: ${analysis.benefits
      .slice(0, 3)
      .join(", ")}. Comenta EU QUERO para receber mais ofertas como essa.`,
    durationSeconds: 20,
    hashtags: ["#shopeebrasil", "#achadinhos", "#promocao", "#reelsbrasil"],
    overlays: [
      {
        sequence: 1,
        text: "ACHADINHO IMPERDIVEL",
        animation: "slide-up",
        startMs: 0,
        endMs: 3500
      },
      {
        sequence: 2,
        text: `${analysis.productName}`,
        animation: "zoom-in",
        startMs: 3500,
        endMs: 9000
      },
      {
        sequence: 3,
        text: `HOJE: R$ ${analysis.price.toFixed(2).replace(".", ",")}`,
        animation: "pop",
        startMs: 9000,
        endMs: 14000
      },
      {
        sequence: 4,
        text: `${benefitA} + ${benefitB}`,
        animation: "slide-left",
        startMs: 14000,
        endMs: 19000
      }
    ],
    trendingAudioLabel: "Brazilian Promo Beat"
  };

  return reelDraftSchema.parse(draft);
}

export async function extractProductDataFromImage(imageUrl: string): Promise<VisionOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackVision();
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: ANALYSIS_SYSTEM_PROMPT }]
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analise este produto e retorne JSON puro." },
            { type: "input_image", image_url: imageUrl }
          ]
        }
      ]
    });

    const rawText = response.output_text?.trim() || "";
    const sanitized = rawText.replace(/^```json/, "").replace(/```$/, "").trim();

    if (!sanitized) {
      return fallbackVision();
    }

    const parsed = JSON.parse(sanitized);
    return visionOutputSchema.parse(parsed);
  } catch {
    return fallbackVision();
  }
}

export async function generateReelDraftFromAnalysis(analysis: VisionOutput): Promise<ReelDraftOutput> {
  return buildReelDraft(analysis);
}
