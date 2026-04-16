"use client";

import { useActionState, useMemo, useState } from "react";
import {
  INSTAGRAM_ACTION_INITIAL_STATE,
  editPublishedCaptionAction,
  publishReelNowAction,
  scheduleReelAction,
  syncReelInsightsAction
} from "@/actions/instagram.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PublishControlsProps {
  reelId: string;
  suggestedCaption: string;
}

export function PublishControls({ reelId, suggestedCaption }: PublishControlsProps) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishReelNowAction,
    INSTAGRAM_ACTION_INITIAL_STATE
  );
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    scheduleReelAction,
    INSTAGRAM_ACTION_INITIAL_STATE
  );
  const [syncState, syncAction, syncPending] = useActionState(syncReelInsightsAction, INSTAGRAM_ACTION_INITIAL_STATE);
  const [editState, editAction, editPending] = useActionState(
    editPublishedCaptionAction,
    INSTAGRAM_ACTION_INITIAL_STATE
  );

  const [scheduledFor, setScheduledFor] = useState("");
  const [caption, setCaption] = useState(suggestedCaption);

  const publicationId = useMemo(() => publishState.publicationId ?? editState.publicationId, [publishState, editState]);

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Publicacao Instagram</h3>
        <p className="mt-1 text-sm text-slate-600">Publique agora, agende e sincronize metricas reais do Reel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={publishAction} className="space-y-2 rounded-xl border border-slate-200 p-3">
          <input type="hidden" name="reelId" value={reelId} />
          <p className="text-sm font-medium text-slate-800">Publicar agora</p>
          <Button type="submit" disabled={publishPending}>
            {publishPending ? "Publicando..." : "Publicar Reel"}
          </Button>
          {publishState.message ? (
            <p className={`text-xs ${publishState.success ? "text-emerald-700" : "text-red-600"}`}>{publishState.message}</p>
          ) : null}
        </form>

        <form action={scheduleAction} className="space-y-2 rounded-xl border border-slate-200 p-3">
          <input type="hidden" name="reelId" value={reelId} />
          <p className="text-sm font-medium text-slate-800">Agendar publicacao</p>
          <Input
            name="scheduledFor"
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
          <Button type="submit" disabled={schedulePending || !scheduledFor}>
            {schedulePending ? "Agendando..." : "Agendar"}
          </Button>
          {scheduleState.message ? (
            <p className={`text-xs ${scheduleState.success ? "text-emerald-700" : "text-red-600"}`}>{scheduleState.message}</p>
          ) : null}
        </form>
      </div>

      <form action={syncAction} className="rounded-xl border border-slate-200 p-3">
        <input type="hidden" name="reelId" value={reelId} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="outline" disabled={syncPending}>
            {syncPending ? "Sincronizando..." : "Sincronizar metricas"}
          </Button>
          {syncState.message ? (
            <p className={`text-xs ${syncState.success ? "text-emerald-700" : "text-red-600"}`}>{syncState.message}</p>
          ) : null}
        </div>
      </form>

      <form action={editAction} className="space-y-2 rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-800">Editar legenda apos publicar</p>

        <input type="hidden" name="publicationId" value={publicationId ?? ""} />

        <div>
          <Label htmlFor="caption">Legenda</Label>
          <Textarea id="caption" name="caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
        </div>

        <Button type="submit" disabled={editPending || !publicationId}>
          {editPending ? "Atualizando..." : "Atualizar legenda no Instagram"}
        </Button>

        {!publicationId ? (
          <p className="text-xs text-amber-700">Publice o Reel primeiro para habilitar edicao de legenda.</p>
        ) : null}

        {publishState.permalink ? (
          <a
            href={publishState.permalink}
            target="_blank"
            rel="noreferrer"
            className="block text-xs font-medium text-blue-700 underline"
          >
            Abrir post publicado
          </a>
        ) : null}

        {editState.message ? (
          <p className={`text-xs ${editState.success ? "text-emerald-700" : "text-red-600"}`}>{editState.message}</p>
        ) : null}
      </form>
    </Card>
  );
}
