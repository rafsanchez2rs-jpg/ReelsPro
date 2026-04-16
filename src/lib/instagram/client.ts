import { serverEnv } from "@/lib/env";

export interface InstagramConnection {
  id: string;
  instagram_user_id: string;
  instagram_username: string;
  access_token: string;
}

export class InstagramGraphError extends Error {
  constructor(message: string, public status?: number, public payload?: unknown) {
    super(message);
    this.name = "InstagramGraphError";
  }
}

function buildGraphUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${serverEnv.META_GRAPH_BASE_URL}/${serverEnv.META_GRAPH_API_VERSION}${normalizedPath}`;
}

export async function graphRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | boolean | undefined | null>;
    accessToken: string;
  }
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(buildGraphUrl(path));
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  params.set("access_token", options.accessToken);

  let response: Response;

  if (method === "GET") {
    url.search = params.toString();
    response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store"
    });
  } else {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      cache: "no-store"
    });
  }

  const json = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok || json.error) {
    throw new InstagramGraphError(json.error?.message ?? "Erro na Graph API", response.status, json);
  }

  return json as T;
}
