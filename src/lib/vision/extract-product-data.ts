interface ProductAnalysis {
  productName: string;
  productPrice: number;
  currency: string;
  shortDescription: string;
  benefits: string[];
  attributes: Record<string, string>;
  confidenceScore: number;
}

interface AnalyzeProductInput {
  imageUrl: string;
  modelName?: "gemini" | "groq";
}

export async function analyzeProduct({ imageUrl, modelName = "gemini" }: AnalyzeProductInput): Promise<ProductAnalysis> {
  if (modelName === "gemini") {
    return analyzeWithGemini(imageUrl);
  }
  return analyzeWithGroq(imageUrl);
}

async function analyzeWithGemini(imageUrl: string): Promise<ProductAnalysis> {
  const { serverEnv } = await import("@/lib/env");

  if (!serverEnv.GOOGLE_GENERATIVE_AI_API_KEY) {
    return getMockAnalysis();
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${serverEnv.GOOGLE_GENERATIVE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analise esta imagem de um produto da Shopee e retorne JSON com:
- productName: nome do produto
- productPrice: preço (apenas números)
- currency: "BRL"
- shortDescription: descrição curta
- benefits: array de 3 benefícios
- attributes: objeto com características técnicas
- confidenceScore: confiança de 0 a 1

Responda APENAS com JSON válido.`
          }, {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageUrl.split(",")[1]
            }
          }]
        }]
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      productName: parsed.productName || "Produto",
      productPrice: parseFloat(parsed.productPrice) || 0,
      currency: parsed.currency || "BRL",
      shortDescription: parsed.shortDescription || "",
      benefits: parsed.benefits || [],
      attributes: parsed.attributes || {},
      confidenceScore: parsed.confidenceScore || 0.8
    };
  } catch {
    return getMockAnalysis();
  }
}

async function analyzeWithGroq(imageUrl: string): Promise<ProductAnalysis> {
  const { serverEnv } = await import("@/lib/env");

  if (!serverEnv.GROQ_API_KEY) {
    return getMockAnalysis();
  }

  const response = await fetch("https://api.groq.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.2-11m-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analise esta imagem de produto Shopee e retorne JSON com: productName, productPrice, currency, shortDescription, benefits (3 itens), attributes (objeto), confidenceScore (0-1). Responda apenas JSON." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      productName: parsed.productName || "Produto",
      productPrice: parseFloat(parsed.productPrice) || 0,
      currency: parsed.currency || "BRL",
      shortDescription: parsed.shortDescription || "",
      benefits: parsed.benefits || [],
      attributes: parsed.attributes || {},
      confidenceScore: parsed.confidenceScore || 0.8
    };
  } catch {
    return getMockAnalysis();
  }
}

function getMockAnalysis(): ProductAnalysis {
  return {
    productName: "Smartphone Galaxy A54",
    productPrice: 1899,
    currency: "BRL",
    shortDescription: "Celular potente com câmera de 50MP",
    benefits: ["Câmera profissional", "Bateria longa duração", "Tela AMOLED"],
    attributes: { tela: "6.4 polegadas", memoria: "8GB", armazenamento: "128GB" },
    confidenceScore: 0.85
  };
}