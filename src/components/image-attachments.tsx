"use client";

import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/api/upload";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  /** Nhãn của nút thêm ảnh. */
  label?: string;
  max?: number;
  disabled?: boolean;
};

/**
 * Ảnh đính kèm gửi xưởng (bản thiết kế, ảnh mẫu): tải lên qua `POST /uploads`, giữ URL. Dùng ở thông số làm riêng
 * của dòng đơn và ở dòng YCSX (2026-10-16).
 */
export function ImageAttachments({ value, onChange, label = "Thêm ảnh", max = 20, disabled }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, max - value.length)) {
        added.push(await uploadImage(file));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tải ảnh lên thất bại");
    } finally {
      if (added.length) onChange([...value, ...added]);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((url) => (
        <div key={url} className="group relative size-16 overflow-hidden rounded-md border">
          <a href={url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Ảnh đính kèm" className="size-full object-cover" />
          </a>
          {!disabled && (
            <button
              type="button"
              aria-label="Bỏ ảnh"
              className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 opacity-80 hover:opacity-100"
              onClick={() => onChange(value.filter((u) => u !== url))}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ))}
      {!disabled && value.length < max && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-16 cursor-pointer flex-col gap-1 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "Đang tải..." : label}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}
    </div>
  );
}
