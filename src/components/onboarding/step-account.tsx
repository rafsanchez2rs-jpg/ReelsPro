"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface StepAccountProps {
  onNext: (data: { fullName: string }) => void;
}

export function StepAccount({ onNext }: StepAccountProps) {
  const [fullName, setFullName] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bem-vindo ao ReelFlow!</CardTitle>
        <CardDescription>Vamos configurar sua conta para começar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Seu nome</label>
          <Input
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <Button onClick={() => onNext({ fullName })} disabled={!fullName.trim()} className="w-full">
          Continuar
        </Button>
      </CardContent>
    </Card>
  );
}