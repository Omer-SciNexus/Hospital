"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { FileCheck, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Drag-and-drop (or click) file picker. Files stay in the browser: we only keep the name. */
export function UploadDropzone({
  image,
  label,
  hint = "PDF, JPG or PNG up to 10 MB",
  accept = ".pdf,.jpg,.jpeg,.png",
  file,
  onFile,
}: {
  image: string;
  label: string;
  hint?: string;
  accept?: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-brand-700 dark:text-brand-200">
          <FileCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB · ready to send</p>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          className="grid size-9 place-items-center rounded-full hover:bg-surface"
          aria-label={`Remove ${file.name}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        "flex flex-col items-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
        over ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-border bg-surface-2",
      )}
    >
      <Image src={image} alt="" width={160} height={160} className="size-24" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Drag a file here, or</p>
      <label
        htmlFor={id}
        className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft focus-within:ring-4 focus-within:ring-brand-500/25 hover:bg-brand-800"
      >
        <Upload className="size-4" aria-hidden /> Choose a file
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            if (input.current) input.current.value = "";
          }}
        />
      </label>
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
