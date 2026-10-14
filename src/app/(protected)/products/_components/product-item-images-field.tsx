"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { uploadImage } from "@/lib/api/upload";

// Khớp @ArrayMaxSize ở BE (dto/product-item.dto.ts).
export const MAX_ITEM_IMAGES = 10;

export type ItemImageValue = { url: string; isThumbnail: boolean };

// Chuẩn hoá danh sách ảnh trước khi gửi lên BE: ảnh đầu tiên luôn là ảnh đại diện,
// và chỉ gửi url + isThumbnail (bỏ id / position mà BE trả về).
export function toItemImagePayload(images: { url: string }[] = []) {
  return images.map((image, index) => ({
    url: image.url,
    isThumbnail: index === 0,
  }));
}

type Props = {
  value: ItemImageValue[];
  onChange: (images: ItemImageValue[]) => void;
  // Đọc danh sách ảnh mới nhất trong form ngay lúc upload xong - không dùng `value` đã chụp
  // lúc bắt đầu upload, nếu không ảnh bị xoá trong lúc chờ sẽ quay lại.
  getLatest: () => ItemImageValue[];
  // Báo cho dialog biết còn ảnh đang tải lên, để khoá nút Lưu.
  // Truyền thẳng setter của useState (tham chiếu ổn định), không truyền arrow function viết inline.
  onBusyChange: (busy: boolean) => void;
  hint?: string;
};

// Ô tải nhiều ảnh cho phiên bản: lưới ảnh nhỏ, ảnh đầu tiên là ảnh đại diện, mỗi ảnh có nút xoá.
export function ProductItemImagesField({
  value,
  onChange,
  getLatest,
  onBusyChange,
  hint,
}: Props) {
  const [pendingCount, setPendingCount] = useState(0);
  // Bản sao số ảnh đang tải để cộng/trừ đúng khi nhiều lượt chọn file chạy chồng nhau.
  const pendingRef = useRef(0);
  // Dialog đóng (field bị gỡ) trong lúc đang tải thì bỏ kết quả: form có thể đã được reset cho
  // một phiên bản khác, ghi vào sẽ gắn ảnh nhầm phiên bản.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Upload bị bỏ dở thì trả lại trạng thái "rảnh", để lần mở dialog sau nút Lưu không bị khoá mãi.
      if (pendingRef.current > 0) {
        pendingRef.current = 0;
        onBusyChange(false);
      }
    };
  }, [onBusyChange]);

  const images = value ?? [];
  const isFull = images.length + pendingCount >= MAX_ITEM_IMAGES;

  function changePending(delta: number) {
    pendingRef.current += delta;
    setPendingCount(pendingRef.current);
    onBusyChange(pendingRef.current > 0);
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    // Xoá giá trị input để chọn lại đúng file đó vẫn kích hoạt onChange.
    e.target.value = "";
    if (selected.length === 0) return;

    const room = MAX_ITEM_IMAGES - (getLatest() ?? []).length - pendingRef.current;
    const files = selected.slice(0, Math.max(room, 0));
    if (files.length < selected.length) {
      toast.warning(`Mỗi phiên bản tối đa ${MAX_ITEM_IMAGES} ảnh, đã bỏ bớt ${selected.length - files.length} ảnh`);
    }
    if (files.length === 0) return;

    changePending(files.length);
    const results = await Promise.allSettled(files.map((file) => uploadImage(file)));
    if (!mountedRef.current) return;
    changePending(-files.length);

    const uploadedUrls: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        uploadedUrls.push(result.value);
      } else {
        toast.error(`Tải ảnh "${files[i].name}" thất bại`);
      }
    });
    if (uploadedUrls.length === 0) return;

    const latest = getLatest() ?? [];
    const roomNow = MAX_ITEM_IMAGES - latest.length;
    const accepted = uploadedUrls.slice(0, Math.max(roomNow, 0));
    if (accepted.length < uploadedUrls.length) {
      toast.warning(`Mỗi phiên bản tối đa ${MAX_ITEM_IMAGES} ảnh, đã bỏ bớt ${uploadedUrls.length - accepted.length} ảnh`);
    }
    const added = accepted.map((url) => ({ url, isThumbnail: false }));
    onChange(toItemImagePayload([...latest, ...added]));
    toast.success(`Đã tải lên ${accepted.length} ảnh`);
  }

  function removeImage(index: number) {
    const latest = getLatest() ?? [];
    const remaining = latest.filter((_, i) => i !== index);
    onChange(toItemImagePayload(remaining));
  }

  return (
    <div className="space-y-2">
      <FormLabel>
        Hình ảnh phiên bản{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({images.length}/{MAX_ITEM_IMAGES})
        </span>
      </FormLabel>

      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="relative size-20 rounded-lg border bg-muted overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`Ảnh phiên bản ${index + 1}`}
              className="object-cover size-full"
            />
            {index === 0 && (
              <Badge className="absolute bottom-1 left-1 px-1 py-0 text-[10px]">
                Ảnh đại diện
              </Badge>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              aria-label={`Xoá ảnh ${index + 1}`}
              className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5 text-destructive shadow cursor-pointer hover:bg-background"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {Array.from({ length: pendingCount }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="size-20 rounded-lg border bg-muted flex items-center justify-center"
          >
            <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ))}

        {images.length === 0 && pendingCount === 0 && (
          <div className="size-20 rounded-lg border bg-muted flex items-center justify-center">
            <ShoppingBag className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        disabled={isFull}
        className="cursor-pointer max-w-xs"
      />
      <p className="text-xs text-muted-foreground">
        Chọn được nhiều ảnh cùng lúc. Ảnh đầu tiên là ảnh đại diện. Hỗ trợ JPG, PNG, tối đa 5MB mỗi ảnh.
        {hint ? ` ${hint}` : ""}
      </p>
    </div>
  );
}
