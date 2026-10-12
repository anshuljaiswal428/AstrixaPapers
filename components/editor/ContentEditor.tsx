"use client";

import { useRef } from "react";
import type { Content, ImageRef } from "@/lib/paper/types";

/** Read a File as a data: URL so images work inline with zero storage setup. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageButton({
  image,
  onChange,
  label = "Image",
}: {
  image?: ImageRef;
  onChange: (img: ImageRef | undefined) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await fileToDataUrl(file);
          onChange({ url, alt: file.name, width: image?.width ?? 60 });
          e.target.value = "";
        }}
      />
      {image?.url ? (
        <span className="inline-flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="h-6 w-6 rounded border object-cover" />
          <input
            type="number"
            title="Width (px)"
            value={image.width ?? 60}
            onChange={(e) => onChange({ ...image, width: Number(e.target.value) || 60 })}
            className="w-14 rounded border px-1 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-red-600 hover:underline"
          >
            remove
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="rounded border border-dashed px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
        >
          + {label}
        </button>
      )}
    </span>
  );
}

/**
 * Edits a Content value: a text field plus an optional inline image.
 * Used for MCQ option content, match items, case passages, etc.
 */
export function ContentEditor({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: Content;
  onChange: (c: Content) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {multiline ? (
        <textarea
          value={value.text ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          className="min-h-[60px] flex-1 rounded border px-2 py-1 text-sm"
        />
      ) : (
        <input
          value={value.text ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
      )}
      <ImageButton
        image={value.image}
        onChange={(image) => onChange({ ...value, image })}
      />
    </div>
  );
}
