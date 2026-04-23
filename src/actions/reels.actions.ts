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
  message?: string;
  success?: boolean;
};

export const REEL_EDITOR_INITIAL_STATE: ReelEditorActionState = {};
export const REEL_GENERATION_INITIAL_STATE: ReelGenerationActionState = {};

export async function createReelFromUploadAction(_payload: FormData): Promise<void> {
  // no-op stub for deployment
  return;
}

export async function renderReelAssetsAction(_payload: FormData): Promise<void> {
  // no-op stub for deployment
  return;
}

export async function saveReelDraftAction(_payload: FormData): Promise<void> {
  // no-op stub for deployment
  return;
}
