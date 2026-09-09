"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, Loader2 } from "lucide-react"

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImageSrc: string | null;
  imageState: { x: number; y: number; zoom: number; rotate: number };
  setImageState: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; zoom: number; rotate: number }>
  >;
  isDragging: boolean;
  dimensions: { w: number; h: number };
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleApplyCrop: () => Promise<void>;
  isUploading: boolean;
}

export function AvatarCropDialog({
  open,
  onOpenChange,
  selectedImageSrc,
  imageState,
  setImageState,
  isDragging,
  dimensions,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleApplyCrop,
  isUploading,
}: AvatarCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md select-none">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa ảnh đại diện</DialogTitle>
          <DialogDescription>
            Kéo chuột/chạm để di chuyển, dùng các thanh trượt để phóng to/thu nhỏ hoặc xoay ảnh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Cropping Frame */}
          <div
            className="relative w-64 h-64 overflow-hidden rounded-lg bg-black/5 border cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {selectedImageSrc && (
              <img
                src={selectedImageSrc}
                alt="Crop preview"
                style={{
                  width: `${dimensions.w}px`,
                  height: `${dimensions.h}px`,
                  left: `${(256 - dimensions.w) / 2}px`,
                  top: `${(256 - dimensions.h) / 2}px`,
                  transform: `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.zoom}) rotate(${imageState.rotate}deg)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="max-w-none max-h-none pointer-events-none absolute"
              />
            )}
            {/* Circular overlay representing the cropped region */}
            <div className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Sliders */}
          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Phóng to / Thu nhỏ</span>
                <span>{Math.round(imageState.zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.01"
                value={imageState.zoom}
                onChange={(e) =>
                  setImageState((prev) => ({
                    ...prev,
                    zoom: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Xoay ảnh</span>
                <span>{imageState.rotate}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={imageState.rotate}
                onChange={(e) =>
                  setImageState((prev) => ({
                    ...prev,
                    rotate: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex justify-center gap-4 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setImageState((prev) => ({
                    ...prev,
                    rotate: (prev.rotate - 90) % 360,
                  }))
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Xoay trái
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setImageState((prev) => ({
                    ...prev,
                    rotate: (prev.rotate + 90) % 360,
                  }))
                }
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Xoay phải
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleApplyCrop} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              "Áp dụng"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
