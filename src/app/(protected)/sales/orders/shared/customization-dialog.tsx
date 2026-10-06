"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderItemCustomization } from "@/types/order-flow";

type Props = {
  /** What the line is, for the title. */
  label: string;
  value: OrderItemCustomization | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `undefined` = the line is no longer made to measure. */
  onSave: (value: OrderItemCustomization | undefined) => void;
};

type SpecDraft = { name: string; value: string; unit: string };

const numOrUndefined = (raw: string) => {
  const n = Number(raw);
  return raw.trim() === "" || !Number.isFinite(n) || n < 0 ? undefined : n;
};

/** The specs agreed with a customer, on one line ("181 × 90 cm · Gỗ óc chó · V-102"). */
export function customizationSummary(c: OrderItemCustomization | null | undefined): string {
  if (!c) return "";
  const size = [c.lengthCm, c.widthCm, c.heightCm].filter((v) => v != null).join(" × ");
  return [
    size ? `${size} cm` : null,
    c.material,
    c.color,
    c.fabricCode,
    ...c.specs.map((s) => `${s.name}: ${s.value}${s.unit ? ` ${s.unit}` : ""}`),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * D-2: the specs a customer agreed for one line (contract §2 `OrderItemCustomization`). Sent with the
 * line on create, the line gets a SKU of its own made to these specs (A-4). Sent whole: a field left
 * empty is not part of the agreement.
 */
export function CustomizationDialog({ label, value, open, onOpenChange, onSave }: Props) {
  const [lengthCm, setLengthCm] = React.useState(value?.lengthCm?.toString() ?? "");
  const [widthCm, setWidthCm] = React.useState(value?.widthCm?.toString() ?? "");
  const [heightCm, setHeightCm] = React.useState(value?.heightCm?.toString() ?? "");
  const [material, setMaterial] = React.useState(value?.material ?? "");
  const [color, setColor] = React.useState(value?.color ?? "");
  const [fabricCode, setFabricCode] = React.useState(value?.fabricCode ?? "");
  const [note, setNote] = React.useState(value?.note ?? "");
  const [specs, setSpecs] = React.useState<SpecDraft[]>(
    value?.specs.map((s) => ({ name: s.name, value: s.value, unit: s.unit ?? "" })) ?? [],
  );

  const built: OrderItemCustomization = {
    lengthCm: numOrUndefined(lengthCm),
    widthCm: numOrUndefined(widthCm),
    heightCm: numOrUndefined(heightCm),
    material: material.trim() || undefined,
    color: color.trim() || undefined,
    fabricCode: fabricCode.trim() || undefined,
    note: note.trim() || undefined,
    attachmentUrls: value?.attachmentUrls ?? [],
    specs: specs
      .filter((s) => s.name.trim() && s.value.trim())
      .map((s) => ({ name: s.name.trim(), value: s.value.trim(), unit: s.unit.trim() || undefined })),
  };
  const empty = !customizationSummary(built) && !built.note;
  const halfSpec = specs.some((s) => !!s.name.trim() !== !!s.value.trim());

  const patchSpec = (index: number, change: Partial<SpecDraft>) =>
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...change } : s)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Thông số làm riêng - {label}</DialogTitle>
          <DialogDescription>
            Dòng này sẽ thành hàng làm theo yêu cầu: hệ thống tạo một mã hàng riêng mang các thông số
            dưới đây để xưởng làm. Bỏ trống kích thước thì giữ theo sản phẩm gốc.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Dài (cm)", lengthCm, setLengthCm],
                ["Rộng (cm)", widthCm, setWidthCm],
                ["Cao (cm)", heightCm, setHeightCm],
              ] as const
            ).map(([text, state, set]) => (
              <div key={text} className="grid gap-1">
                <Label>{text}</Label>
                <Input type="number" min={0} value={state} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Chất liệu</Label>
              <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Màu sắc</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Mã vải</Label>
              <Input value={fabricCode} onChange={(e) => setFabricCode(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Thông số khác</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSpecs((prev) => [...prev, { name: "", value: "", unit: "" }])}
              >
                <Plus className="size-4" />
                Thêm
              </Button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_5rem_2rem] gap-2">
                <Input
                  placeholder="Tên (vd. Cao lưng tựa)"
                  value={spec.name}
                  onChange={(e) => patchSpec(index, { name: e.target.value })}
                />
                <Input
                  placeholder="Giá trị"
                  value={spec.value}
                  onChange={(e) => patchSpec(index, { value: e.target.value })}
                />
                <Input
                  placeholder="Đơn vị"
                  value={spec.unit}
                  onChange={(e) => patchSpec(index, { unit: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Bỏ thông số"
                  onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {halfSpec && (
              <p className="text-xs text-destructive">Mỗi thông số cần cả tên và giá trị.</p>
            )}
          </div>

          <div className="grid gap-1">
            <Label>Ghi chú cho xưởng</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onSave(undefined)}>
              Bỏ làm riêng
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="button" disabled={empty || halfSpec} onClick={() => onSave(built)}>
              Lưu thông số
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
