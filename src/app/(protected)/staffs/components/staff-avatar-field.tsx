"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getStaffInitials } from "@/app/(protected)/staffs/shared/staff-format";

export const STAFF_AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_SIZE_MB = 5;

type StaffAvatarFieldProps = {
  previewUrl?: string;
  hasPendingFile?: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  fullName?: string;
};

export function StaffAvatarField({
  previewUrl,
  onSelectFile,
  onRemove,
  fullName,
}: StaffAvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!STAFF_AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_SIZE_MB}MB`);
      return;
    }

    onSelectFile(file);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {previewUrl ? (
          <AvatarImage src={previewUrl} alt={fullName ?? "Avatar"} />
        ) : null}
        <AvatarFallback>{getStaffInitials(fullName)}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={STAFF_AVATAR_ACCEPTED_TYPES.join(",")}
            className="hidden"
            aria-label="Chọn ảnh đại diện"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-2 size-4" />
            {previewUrl ? "Đổi ảnh" : "Chọn ảnh"}
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground"
              onClick={onRemove}
            >
              <X className="mr-2 size-4" />
              Xóa ảnh
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
