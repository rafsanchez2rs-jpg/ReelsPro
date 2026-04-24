// Conteúdo consolidado com campos adicionais para vídeo e análise
export type ReelEditorActionState = {
  reelId?: string;
  draft?: any;
  imageUrl?: string;
  message?: string;
  success?: boolean;
  // novas props para compatibilidade
  videoUrl?: string;
  videoSignedUrl?: string;
  analysis?: {
    productName: string;
    productPrice: number;
    shortDescription: string;
    benefits: string[];
    confidence?: number;
  };
};

export type ReelGenerationActionState = {
  reelId?: string;
  draft?: any;
  imageUrl?: string;
  videoSignedUrl?: string;
  videoUrl?: string;
  videoUrl?: string;
  message?: string;
  success?: boolean;
  analysis?: {
    productName: string;
    productPrice: number;
    shortDescription: string;
    benefits: string[];
    confidence?: number;
  };
};

export const REEL_EDITOR_INITIAL_STATE: ReelEditorActionState = {};
export const REEL_GENERATION_INITIAL_STATE: ReelGenerationActionState = {};

export async function createReelFromUploadAction(
  state: ReelGenerationActionState,
  _payload: FormData
): Promise<ReelGenerationActionState> {
  return { ...state };
}

export async function renderReelAssetsAction(
  state: ReelEditorActionState,
  _payload: FormData
): Promise<ReelEditorActionState> {
  return { ...state };
}

export async function saveReelDraftAction(
  state: ReelEditorActionState,
  _payload: FormData
): Promise<ReelEditorActionState> {
  return { ...state };
}