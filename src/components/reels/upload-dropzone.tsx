"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onUpload: (payload: File) => void;
  onFileChange?: (payload: any) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}
export function UploadDropzone({
  onUpload,
  onFileChange,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024,
  disabled = false
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    validateAndUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onFileChange) onFileChange(file);
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Por favor, envie uma imagem (PNG, JPG ou WebP)");
      return;
    }

    if (file.size > maxSize) {
      setError(`Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    onUpload(file);
  };

  if (preview) {
    return (
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        <button
          onClick={() => setPreview(null)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-medium"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition",
        isDragging
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="flex flex-col items-center gap-2 cursor-pointer">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)]">
          <svg className="w-6 h-6 text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-sm font-medium">Arraste ou clique para enviar</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">PNG, JPG ou WebP (max 10MB)</p>
      </label>
      {error && <p className="mt-2 text-sm text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}