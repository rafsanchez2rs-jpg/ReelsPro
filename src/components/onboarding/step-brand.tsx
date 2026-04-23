"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BrandData {
  brandName: string;
  brandColor: string;
  accentPhrase: string;
}

interface StepBrandProps {
  onNext: (data: BrandData) => void;
  onBack: () => void;
  initialData?: BrandData;
}

export function StepBrand({ onNext, onBack, initialData }: StepBrandProps) {
  const [brandName, setBrandName] = useState(initialData?.brandName || "");
  const [brandColor, setBrandColor] = useState(initialData?.brandColor || "#E1306C");
  const [accentPhrase, setAccentPhrase] = useState(initialData?.accentPhrase || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalize sua Marca</CardTitle>
        <CardDescription>Adicione identity visual aos seus Reels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome da sua marca</label>
          <Input
            placeholder="Minha Loja"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cor principal</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)]"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Frase de impacto</label>
          <Input
            placeholder="O melhor preço você encontra aqui!"
            value={accentPhrase}
            onChange={(e) => setAccentPhrase(e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Frase que appears nos seus Reels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={() => onNext({ brandName, brandColor, accentPhrase })} disabled={!brandName.trim()} className="flex-1">
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}