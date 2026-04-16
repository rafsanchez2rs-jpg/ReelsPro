export function buildThumbnailHeadline(productName: string, price: number): string {
  const formattedPrice = price.toFixed(2).replace(".", ",");
  return `${productName} com preco de ataque: R$ ${formattedPrice}`;
}
