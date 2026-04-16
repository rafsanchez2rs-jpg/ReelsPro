"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileChange, disabled = false }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptLabel = useMemo(() => "JPG, PNG ou WEBP ate 10MB", []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (file: File | null) => {
    onFileChange(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  return (
    <div className="space-y-3">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          const file = event.dataTransfer.files?.[0] ?? null;

          if (inputRef.current && file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            inputRef.current.files = dataTransfer.files;
          }

          handleFile(file);
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center transition",
          isDragOver && "border-[var(--brand)] bg-blue-50",
          disabled && "cursor-not-allowed opacity-70"
        )}
      >
        <UploadCloud className="mb-3 size-8 text-slate-500" />
        <p className="text-sm font-semibold text-slate-800">Arraste seu print/foto da Shopee aqui</p>
        <p className="mt-1 text-xs text-slate-500">ou clique para selecionar</p>
        <p className="mt-2 text-xs text-slate-400">{acceptLabel}</p>

        <input
          ref={inputRef}
          disabled={disabled}
          type="file"
          name="productFile"
          className="hidden"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            handleFile(file);
          }}
        />
      </label>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview do produto" className="h-52 w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
