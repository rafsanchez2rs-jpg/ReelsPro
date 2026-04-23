interface ScriptGeneratorInput {
  productName: string;
  productPrice: number;
  shortDescription: string;
  benefits: string[];
  voiceMode?: "text" | "elevenlabs" | "cartesia";
}

interface GeneratedScript {
  hookText: string;
  caption: string;
  narration: string;
  hashtags: string[];
}

export function generateScript(input: ScriptGeneratorInput): GeneratedScript {
  const { productName, productPrice, shortDescription, benefits, voiceMode } = input;

  const hookTexts = [
    "Você NÃO vai acreditar no preço disso! 🔥",
    "Olha só esse produto!",
    "Esse produto vai mudar sua vida!",
    "Não acredito que isso tá tão barato! 😱",
    "Precisa ver esse produto!"
  ];

  const captions = [
    `${productName} - ${shortDescription} por apenas R$ ${productPrice.toFixed(2)}!`,
    `Corre que logo sai! ${shortDescription}`,
    `Não perca essa oferta especial de ${productName}`
  ];

  const narrations = [
    `Olha só que produto incrível! ${productName} por apenas ${productPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}! ${shortDescription}. ${benefits.slice(0, 2).join('. ')}.`,
    `Não perdeu ainda? ${productName} tá em oferta! ${benefits.join('. ')}.`,
    `Vem comigo que eu te mostro esse produto! ${productName}, ${shortDescription}, por ${productPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
  ];

  const hashtags = [
    `#${productName.replace(/\s+/g, '')}`,
    `#${shortDescription.replace(/\s+/g, '')}`,
    "#shopee",
    "#oferta",
    "#promocao",
    "#compraonline",
    "#brasil"
  ];

  const randomHook = hookTexts[Math.floor(Math.random() * hookTexts.length)];
  const randomCaption = captions[Math.floor(Math.random() * captions.length)];
  const randomNarration = narrations[Math.floor(Math.random() * narrations.length)];

  return {
    hookText: randomHook,
    caption: randomCaption,
    narration: randomNarration,
    hashtags
  };
}