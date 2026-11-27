"use client";

import { useState } from "react";

/** Cạnh khung xem trước trong dialog (px). Toạ độ kéo/zoom đều tính theo khung này. */
export const CROP_VIEWPORT = 256;
/** Cạnh ảnh xuất ra (px): gấp đôi khung xem để ảnh sắc trên màn hình mật độ cao. */
const OUTPUT_SIZE = 512;

export interface CropState {
  x: number;
  y: number;
  zoom: number;
  rotate: number;
}

const INITIAL_STATE: CropState = { x: 0, y: 0, zoom: 1, rotate: 0 };

interface UseImageCropOptions {
  /** Màu nền phía sau ảnh khi xuất. `null` giữ trong suốt (logo PNG); avatar dùng trắng. */
  background?: string | null;
}

/** State và thao tác của dialog cắt ảnh vuông. */
export function useImageCrop({ background = "#ffffff" }: UseImageCropOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<CropState>(INITIAL_STATE);
  const [dimensions, setDimensions] = useState({ w: CROP_VIEWPORT, h: CROP_VIEWPORT });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /** Đọc file và mở dialog. Ảnh được phủ kín khung theo cạnh ngắn. */
  const open = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultSrc = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        setDimensions(
          aspect > 1
            ? { w: CROP_VIEWPORT * aspect, h: CROP_VIEWPORT }
            : { w: CROP_VIEWPORT, h: CROP_VIEWPORT / aspect },
        );
        setSrc(resultSrc);
        setState(INITIAL_STATE);
        setIsOpen(true);
      };
      img.src = resultSrc;
    };
    reader.readAsDataURL(file);
  };

  const pointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - state.x, y: clientY - state.y });
  };
  const pointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setState((prev) => ({ ...prev, x: clientX - dragStart.x, y: clientY - dragStart.y }));
  };

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      pointerDown(e.clientX, e.clientY);
    },
    onMouseMove: (e: React.MouseEvent) => pointerMove(e.clientX, e.clientY),
    onMouseUp: () => setIsDragging(false),
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      pointerDown(e.touches[0].clientX, e.touches[0].clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      pointerMove(e.touches[0].clientX, e.touches[0].clientY);
    },
  };

  /** Vẽ phần ảnh nằm trong khung ra PNG vuông `OUTPUT_SIZE`. */
  const crop = async (): Promise<Blob> => {
    if (!src) throw new Error("No image selected");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    }

    const k = OUTPUT_SIZE / CROP_VIEWPORT;
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.translate(state.x * k, state.y * k);
    ctx.rotate((state.rotate * Math.PI) / 180);
    ctx.scale(state.zoom * k, state.zoom * k);
    ctx.drawImage(img, -dimensions.w / 2, -dimensions.h / 2, dimensions.w, dimensions.h);

    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not export cropped image"))),
        "image/png",
      ),
    );
  };

  return {
    isOpen,
    setIsOpen,
    src,
    state,
    setState,
    dimensions,
    isDragging,
    handlers,
    open,
    crop,
  };
}

export type ImageCrop = ReturnType<typeof useImageCrop>;
