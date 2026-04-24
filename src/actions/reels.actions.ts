// Minimal stubs to satisfy deployment/build when full business logic is not required.

export type ReelEditorActionState = {
  reelId?: string;
  draft?: any;
  imageUrl?: string;
  message?: string;
  success?: boolean;
};

export type ReelGenerationActionState = {
  reelId?: string;
  draft?: any;
  imageUrl?: string;
  videoSignedUrl?: string;
  videoUrl?: string;
  message?: string;
  success?: boolean;
  analysis?: {
    productName: string;
    price: number;
    description: string;
    benefits: string[];
    confidence: number;
  };
};

export const REEL_EDITOR_INITIAL_STATE: ReelEditorActionState = {};
export const REEL_GENERATION_INITIAL_STATE: ReelGenerationActionState = {};

export async function createReelFromUploadAction(
  state: ReelGenerationActionState,
  _payload: FormData
): Promise<ReelGenerationActionState> {
  // no-op: preserve state for deployment
  return { ...state };
}

export async function renderReelAssetsAction(
  state: ReelEditorActionState,
  _payload: FormData
): Promise<ReelEditorActionState> {
  // no-op: preserve state for deployment
  return { ...state };
}

export async function saveReelDraftAction(
  state: ReelEditorActionState,
  _payload: FormData
): Promise<ReelEditorActionState> {
  // no-op: preserve state for deployment
  return { ...state };
}
