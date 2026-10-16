"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productApi } from "@/lib/api/product";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type { ProductAttribute } from "@/types/product";

type Props = {
  productId: string;
  onAdded: (attribute: ProductAttribute) => void;
};

/**
 * Nút "Thêm thuộc tính": thêm một thuộc tính cho sản phẩm ngay tại màn đang làm (thông số làm riêng, YCSX), không
 * phải quay về màn Hàng hoá. Ghi thẳng vào sản phẩm (`POST /products/:id/attributes`, cần quyền sửa hàng hoá).
 */
export function AddProductAttribute({ productId, onAdded }: Props) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const attribute = await productApi.addAttribute(productId, {
        name: name.trim(),
        unit: unit.trim() || undefined,
      });
      onAdded(attribute);
      toast.success(`Đã thêm thuộc tính "${attribute.name}" cho hàng hoá`);
      setName("");
      setUnit("");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không thêm được thuộc tính");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="h-7 w-fit cursor-pointer text-xs" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Thêm thuộc tính
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        autoFocus
        className="h-8 w-44"
        placeholder="Tên (VD: Chân bàn)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
        }}
      />
      <Input className="h-8 w-24" placeholder="Đơn vị" value={unit} onChange={(e) => setUnit(e.target.value)} />
      <Button type="button" size="sm" className="h-8" disabled={!name.trim() || saving} onClick={save}>
        {saving ? "Đang lưu..." : "Thêm"}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setOpen(false)}>
        Huỷ
      </Button>
    </div>
  );
}
