"use client";

import * as React from "react";
import { Loader2, Store, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/api/upload";
import { updateMyTenantLogo } from "@/lib/api/tenant";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { useShopProfileStore } from "@/store/shop-profile-store";
import { ImageCropDialog } from "@/components/image-crop/image-crop-dialog";
import { useImageCrop } from "@/components/image-crop/use-image-crop";

/** Khớp giới hạn của `POST /uploads` (jpg/jpeg/png/webp/gif, 5MB), để báo ngay thay vì chờ BE từ chối. */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

interface StoreLogoFieldProps {
  logoUrl: string | null;
  /** `tenants:update`: không có thì chỉ xem logo. */
  canEdit: boolean;
  onChange: (logoUrl: string | null) => void;
}

/**
 * Logo cửa hàng. Chọn ảnh mở dialog cắt (như avatar); chỉ khi bấm "Xác nhận" ảnh mới được cắt, tải lên và lưu
 * (`PUT /tenant/me` chỉ với `logoUrl`), không chờ nút "Lưu thay đổi" của form. Huỷ dialog thì không có gì thay đổi.
 * Nền giữ trong suốt, để logo PNG không bị phủ nền trắng.
 */
export function StoreLogoField({ logoUrl, canEdit, onChange }: StoreLogoFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const setSharedLogo = useShopProfileStore((s) => s.setLogoUrl);
  const crop = useImageCrop({ background: null });

  const save = async (next: string | null, successMessage: string) => {
    await updateMyTenantLogo(next);
    onChange(next);
    setSharedLogo(next);
    toast.success(successMessage);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ảnh vượt quá 5MB");
      return;
    }

    crop.open(file);
  };

  const handleConfirmCrop = async () => {
    setIsBusy(true);
    try {
      const blob = await crop.crop();
      const url = await uploadImage(new File([blob], "logo.png", { type: "image/png" }));
      await save(url, "Đã cập nhật logo cửa hàng");
      crop.setIsOpen(false);
    } catch (error) {
      const body = getApiErrorBody(error);
      toast.error(messageForCode(body?.code) || body?.message || "Tải logo thất bại");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemove = async () => {
    setIsBusy(true);
    try {
      await save(null, "Đã gỡ logo cửa hàng");
    } catch (error) {
      const body = getApiErrorBody(error);
      toast.error(messageForCode(body?.code) || body?.message || "Gỡ logo thất bại");
    } finally {
      setIsBusy(false);
    }
  };

  const interactive = canEdit && !isBusy;

  return (
    <div className="flex flex-col items-center gap-3 w-full md:w-44 shrink-0">
      <Label className="text-sm font-medium self-start md:self-center">Logo Cửa hàng</Label>

      <button
        type="button"
        disabled={!interactive}
        onClick={() => inputRef.current?.click()}
        aria-label={logoUrl ? "Đổi logo cửa hàng" : "Tải logo cửa hàng lên"}
        className="relative group w-32 h-32 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 overflow-hidden flex items-center justify-center enabled:cursor-pointer disabled:cursor-default"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL Cloudinary tuỳ ý, không khai báo trong `images.remotePatterns`.
          <img src={logoUrl} alt="Logo cửa hàng" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <Store className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <span className="text-2xs text-muted-foreground mt-1 block">Chưa có logo</span>
          </div>
        )}

        {isBusy && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {interactive && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
            <Upload className="h-5 w-5 mb-1" />
            <span className="text-3xs font-medium">{logoUrl ? "Đổi ảnh" : "Tải ảnh lên"}</span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFile}
      />

      {canEdit && logoUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={handleRemove}
          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Gỡ logo
        </Button>
      )}

      {canEdit && (
        <p className="text-[10px] text-muted-foreground text-center">
          Khuyên dùng ảnh vuông, tối đa 5MB.
        </p>
      )}

      <ImageCropDialog
        crop={crop}
        title="Chỉnh sửa logo cửa hàng"
        shape="square"
        confirmLabel="Xác nhận"
        busy={isBusy}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}
