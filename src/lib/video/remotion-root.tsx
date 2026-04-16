import { Composition } from "remotion";
import { ReelComposition, type ReelCompositionProps } from "./remotion-composition";

export const REMOTION_COMPOSITION_ID = "ReelShopeeComposition";

const DEFAULT_PROPS: ReelCompositionProps = {
  productImageUrl: "https://picsum.photos/1080/1920",
  thumbnailHeadline: "Oferta de Hoje",
  hookText: "Produto em destaque com alto potencial de conversao",
  caption: "",
  overlays: [
    { sequence: 1, text: "ACHADO DA SHOPEE", animation: "slide-up", startMs: 0, endMs: 3000 },
    { sequence: 2, text: "DESCONTO REAL", animation: "pop", startMs: 3000, endMs: 7000 }
  ],
  durationSeconds: 20
};

export default function RemotionRoot() {
  return (
    <Composition
      id={REMOTION_COMPOSITION_ID}
      component={ReelComposition}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={DEFAULT_PROPS.durationSeconds * 30}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => {
        const durationSeconds = Math.max(15, Math.min(30, Number(props.durationSeconds ?? 20)));
        return {
          durationInFrames: durationSeconds * 30,
          props
        };
      }}
    />
  );
}

