"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StepShellProps {
  onComplete: () => void;
}

export function StepShell({ onComplete }: StepShellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pronto para Criar!</CardTitle>
        <CardDescription>Sua conta está configurada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={100} />
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            100% configurado
          </p>
        </div>
        <div className="rounded-lg bg-[var(--color-muted)] p-4">
          <p className="text-center text-sm">
            <strong>Próximos passos:</strong>
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-muted-foreground)]">
            <li>Faça upload de uma foto do seu produto da Shopee</li>
            <li>A IA analisará automaticamente</li>
            <li> Gere seu Reel em segundos</li>
            <li>Baixe e poste no Instagram</li>
          </ul>
        </div>
        <Button onClick={onComplete} className="w-full">
          Começar a Criar Reels
        </Button>
      </CardContent>
    </Card>
  );
}