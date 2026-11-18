"use client";

import * as React from "react";
import { Loader2, RotateCcw, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CROP_VIEWPORT, type ImageCrop } from "./use-image-crop";

interface ImageCropDialogProps {
  crop: ImageCrop;
  title: string;
  /** Khung tròn cho avatar, vuông bo góc cho logo. Ảnh xuất ra luôn vuông; khung chỉ là cách nó sẽ hiển thị. */
  shape?: "circle" | "square";
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Dialog kéo / phóng to / xoay ảnh trước khi dùng. Chỉ `onConfirm` mới lấy ảnh; huỷ hoặc đóng thì bỏ. */
export function ImageCropDialog({
  crop,
  title,
  shape = "circle",
  confirmLabel = "Áp dụng",
  busyLabel = "Đang tải lên...",
  busy = false,
  onConfirm,
}: ImageCropDialogProps) {
  const { state, setState, dimensions, isDragging, handlers, src } = crop;

  return (
    <Dialog open={crop.isOpen} onOpenChange={(open) => !busy && crop.setIsOpen(open)}>
      <DialogContent className="sm:max-w-md select-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Kéo chuột/chạm để di chuyển, dùng các thanh trượt để phóng to/thu nhỏ hoặc xoay ảnh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div
            className="relative overflow-hidden rounded-lg bg-black/5 border cursor-move"
            style={{ width: CROP_VIEWPORT, height: CROP_VIEWPORT }}
            onMouseDown={handlers.onMouseDown}
            onMouseMove={handlers.onMouseMove}
            onMouseUp={handlers.onMouseUp}
            onMouseLeave={handlers.onMouseUp}
            onTouchStart={handlers.onTouchStart}
            onTouchMove={handlers.onTouchMove}
            onTouchEnd={handlers.onMouseUp}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL của ảnh vừa chọn.
              <img
                src={src}
                alt="Xem trước"
                style={{
                  width: `${dimensions.w}px`,
                  height: `${dimensions.h}px`,
                  left: `${(CROP_VIEWPORT - dimensions.w) / 2}px`,
                  top: `${(CROP_VIEWPORT - dimensions.h) / 2}px`,
                  transform: `translate(${state.x}px, ${state.y}px) scale(${state.zoom}) rotate(${state.rotate}deg)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="max-w-none max-h-none pointer-events-none absolute"
              />
            )}
            <div
              className={`absolute inset-0 border-2 border-primary pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
                shape === "circle" ? "rounded-full" : "rounded-md"
              }`}
            />
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Phóng to / Thu nhỏ</span>
                <span>{Math.round(state.zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.01"
                value={state.zoom}
                onChange={(e) => setState((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Xoay ảnh</span>
                <span>{state.rotate}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={state.rotate}
                onChange={(e) => setState((prev) => ({ ...prev, rotate: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex justify-center gap-4 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, rotate: (prev.rotate - 90) % 360 }))}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Xoay trái
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, rotate: (prev.rotate + 90) % 360 }))}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Xoay phải
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => crop.setIsOpen(false)} disabled={busy}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {busyLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
