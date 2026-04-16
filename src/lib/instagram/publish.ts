import { createServerSupabaseClient } from "@/lib/supabase/server";
import { graphRequest, type InstagramConnection } from "@/lib/instagram/client";
import { incrementUsageCounter } from "@/lib/stripe/billing";

interface PublicationInsertResult {
  publicationId: string;
}

async function getPrimaryConnection(tenantId: string): Promise<InstagramConnection> {
  const supabase = await createServerSupabaseClient();

  const { data: primary, error: primaryError } = await supabase
    .from("instagram_connections")
    .select("id, instagram_user_id, instagram_username, access_token")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("is_primary", true)
    .maybeSingle();

  if (primaryError) {
    throw new Error(`Falha ao buscar conexao Instagram: ${primaryError.message}`);
  }

  if (primary) {
    return primary;
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("instagram_connections")
    .select("id, instagram_user_id, instagram_username, access_token")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) {
    throw new Error("Nenhuma conta Instagram conectada para este tenant");
  }

  return fallback;
}

async function insertPublicationRow(input: {
  tenantId: string;
  reelId: string;
  connectionId: string;
  createdBy: string;
  status: "scheduled" | "publishing";
  scheduledFor?: string;
}): Promise<PublicationInsertResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reel_publications")
    .insert({
      tenant_id: input.tenantId,
      reel_id: input.reelId,
      instagram_connection_id: input.connectionId,
      status: input.status,
      scheduled_for: input.scheduledFor ?? null,
      created_by: input.createdBy
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao registrar publicacao: ${error?.message ?? "erro desconhecido"}`);
  }

  return { publicationId: data.id };
}

export async function publishReelNow(input: {
  tenantId: string;
  userId: string;
  reelId: string;
}): Promise<{
  publicationId: string;
  instagramMediaId: string;
  permalink?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const connection = await getPrimaryConnection(input.tenantId);

  const { data: reel, error: reelError } = await supabase
    .from("reels")
    .select("caption, video_storage_path")
    .eq("id", input.reelId)
    .eq("tenant_id", input.tenantId)
    .is("deleted_at", null)
    .single();

  if (reelError || !reel) {
    throw new Error(`Reel nao encontrado: ${reelError?.message ?? "erro desconhecido"}`);
  }

  if (!reel.video_storage_path) {
    throw new Error("Reel ainda nao possui video renderizado para publicar");
  }

  const { data: signedVideo } = await supabase.storage
    .from("reelshopee-assets")
    .createSignedUrl(reel.video_storage_path, 60 * 60);

  if (!signedVideo?.signedUrl) {
    throw new Error("Falha ao gerar URL assinada para o video");
  }

  const { publicationId } = await insertPublicationRow({
    tenantId: input.tenantId,
    reelId: input.reelId,
    connectionId: connection.id,
    createdBy: input.userId,
    status: "publishing"
  });

  const container = await graphRequest<{ id: string }>(`/${connection.instagram_user_id}/media`, {
    method: "POST",
    accessToken: connection.access_token,
    params: {
      media_type: "REELS",
      video_url: signedVideo.signedUrl,
      caption: reel.caption ?? "",
      share_to_feed: true
    }
  });

  const publish = await graphRequest<{ id: string }>(`/${connection.instagram_user_id}/media_publish`, {
    method: "POST",
    accessToken: connection.access_token,
    params: {
      creation_id: container.id
    }
  });

  const mediaFields = await graphRequest<{ permalink?: string }>(`/${publish.id}`, {
    method: "GET",
    accessToken: connection.access_token,
    params: {
      fields: "permalink"
    }
  });

  const updatePublication = await supabase
    .from("reel_publications")
    .update({
      status: "published",
      instagram_creation_id: container.id,
      instagram_media_id: publish.id,
      instagram_permalink: mediaFields.permalink ?? null,
      published_at: new Date().toISOString(),
      response_payload: {
        container,
        publish,
        mediaFields
      }
    })
    .eq("id", publicationId)
    .eq("tenant_id", input.tenantId);

  if (updatePublication.error) {
    throw new Error(`Publicou no Instagram, mas falhou ao salvar status: ${updatePublication.error.message}`);
  }

  const updateReel = await supabase
    .from("reels")
    .update({
      status: "published",
      published_at: new Date().toISOString()
    })
    .eq("id", input.reelId)
    .eq("tenant_id", input.tenantId);

  if (updateReel.error) {
    throw new Error(`Publicou no Instagram, mas falhou ao atualizar reel: ${updateReel.error.message}`);
  }

  await incrementUsageCounter({
    tenantId: input.tenantId,
    publishedDelta: 1
  });

  return {
    publicationId,
    instagramMediaId: publish.id,
    permalink: mediaFields.permalink
  };
}

export async function scheduleReelPublication(input: {
  tenantId: string;
  userId: string;
  reelId: string;
  scheduledForIso: string;
}): Promise<{ publicationId: string }> {
  const supabase = await createServerSupabaseClient();
  const connection = await getPrimaryConnection(input.tenantId);

  const { publicationId } = await insertPublicationRow({
    tenantId: input.tenantId,
    reelId: input.reelId,
    connectionId: connection.id,
    createdBy: input.userId,
    status: "scheduled",
    scheduledFor: input.scheduledForIso
  });

  const { error: reelUpdateError } = await supabase
    .from("reels")
    .update({ status: "scheduled" })
    .eq("id", input.reelId)
    .eq("tenant_id", input.tenantId);

  if (reelUpdateError) {
    throw new Error(`Falha ao atualizar reel como agendado: ${reelUpdateError.message}`);
  }

  return { publicationId };
}

export async function updatePublishedCaption(input: {
  tenantId: string;
  publicationId: string;
  caption: string;
}): Promise<{ updated: boolean }> {
  const supabase = await createServerSupabaseClient();

  const { data: publication, error: publicationError } = await supabase
    .from("reel_publications")
    .select("instagram_media_id, instagram_connection_id")
    .eq("id", input.publicationId)
    .eq("tenant_id", input.tenantId)
    .single();

  if (publicationError || !publication?.instagram_media_id) {
    throw new Error(`Publicacao invalida para edicao: ${publicationError?.message ?? "sem media id"}`);
  }

  const { data: connection, error: connectionError } = await supabase
    .from("instagram_connections")
    .select("access_token")
    .eq("id", publication.instagram_connection_id)
    .eq("tenant_id", input.tenantId)
    .single();

  if (connectionError || !connection) {
    throw new Error(`Conexao Instagram nao encontrada: ${connectionError?.message ?? "erro desconhecido"}`);
  }

  await graphRequest<{ success: boolean }>(`/${publication.instagram_media_id}`, {
    method: "POST",
    accessToken: connection.access_token,
    params: {
      caption: input.caption
    }
  });

  const { error: dbError } = await supabase
    .from("reel_publications")
    .update({ published_caption: input.caption })
    .eq("id", input.publicationId)
    .eq("tenant_id", input.tenantId);

  if (dbError) {
    throw new Error(`Caption atualizada no Instagram, mas falhou no banco: ${dbError.message}`);
  }

  return { updated: true };
}
