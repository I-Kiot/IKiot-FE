"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { safeImageSrc } from "../_constants/product.constants";

type GalleryImage = { url: string };

type Props = {
  images: GalleryImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  alt: string;
};

// Lightbox xem ảnh: ảnh lớn ở giữa, nút / phím mũi tên chuyển ảnh trước-sau (vòng lại khi tới cuối),
// dải ảnh nhỏ bên dưới để nhảy thẳng tới một ảnh.
// Muốn mở lại từ ảnh đầu tiên: component cha đổi `key` khi mở, vì index khởi tạo từ initialIndex.
export function ImageGalleryDialog({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
  alt,
}: Props) {
  const [index, setIndex] = useState(initialIndex);

  const total = images.length;
  if (total === 0) return null;

  const hasMany = total > 1;
  // Chặn index vượt quá khi danh sách ảnh ngắn đi trong lúc đang mở.
  const currentIndex = Math.min(index, total - 1);
  const current = images[currentIndex];

  function showPrevious() {
    setIndex((i) => (Math.min(i, total - 1) - 1 + total) % total);
  }

  function showNext() {
    setIndex((i) => (Math.min(i, total - 1) + 1) % total);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!hasMany) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      showPrevious();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      showNext();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl p-4 gap-3"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="text-sm pr-8">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Ảnh {currentIndex + 1} / {total}
        </DialogDescription>

        <div className="relative w-full h-[65vh] rounded-lg bg-muted overflow-hidden">
          <Image
            src={safeImageSrc(current.url)}
            alt={`${alt} - ảnh ${currentIndex + 1}`}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-contain"
          />

          {hasMany && (
            <>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={showPrevious}
                aria-label="Ảnh trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow cursor-pointer"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={showNext}
                aria-label="Ảnh sau"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow cursor-pointer"
              >
                <ChevronRight className="size-5" />
              </Button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium tabular-nums">
                {currentIndex + 1} / {total}
              </span>
            </>
          )}
        </div>

        {hasMany && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, i) => (
              <button
                key={`${image.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-md border-2 cursor-pointer",
                  i === currentIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={safeImageSrc(image.url)}
                  alt={`${alt} - ảnh nhỏ ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
