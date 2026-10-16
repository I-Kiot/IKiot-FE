import type { OrderItemCustomization } from "@/types/order-flow";
import { cn } from "@/lib/utils";

type Chip = { name: string; base?: string | null; value: string; unit?: string | null };

/** Mỗi thay đổi / thông số một chip; bản ghi cũ (ô cố định) cũng đọc được. */
function chipsOf(c: Pick<OrderItemCustomization, "specs"> & Partial<OrderItemCustomization>): Chip[] {
  const chips: Chip[] = [];
  const size = [c.lengthCm, c.widthCm, c.heightCm].filter((v) => v != null).join("×");
  if (size) chips.push({ name: "Kích thước", value: size, unit: "cm" });
  if (c.material) chips.push({ name: "Chất liệu", value: c.material });
  if (c.color) chips.push({ name: "Màu sắc", value: c.color });
  if (c.fabricCode) chips.push({ name: "Mã vải", value: c.fabricCode });
  for (const s of c.specs ?? []) {
    chips.push({
      name: s.name,
      base: s.attributeId && s.baseValue && s.baseValue !== s.value ? s.baseValue : null,
      value: s.value,
      unit: s.unit,
    });
  }
  return chips;
}

const chipText = (c: Chip) =>
  `${c.name}: ${c.base ? `${c.base} → ` : ""}${c.value}${c.unit ? ` ${c.unit}` : ""}`;

type Props = {
  customization: Pick<OrderItemCustomization, "specs"> & Partial<OrderItemCustomization>;
  /** Hiện tối đa bấy nhiêu chip, phần còn lại gom thành "+N" (rê chuột để xem). Bỏ trống = hiện hết. */
  max?: number;
  /** Chỗ hẹp (dòng giỏ hàng): bỏ giá trị gốc gạch ngang, vẫn xem được khi rê chuột. */
  compact?: boolean;
  className?: string;
};

/**
 * Thay đổi khách đặt riêng, mỗi thay đổi một chip nhỏ tự xuống hàng ("Màu: ~~Óc chó~~ Trắng"), thay cho một chuỗi
 * dài nối bằng dấu chấm - đổi nhiều thuộc tính thì chuỗi đó kéo giãn cả ô sản phẩm.
 */
export function CustomizationChips({ customization, max, compact, className }: Props) {
  const chips = chipsOf(customization);
  if (chips.length === 0) return null;
  const shown = max ? chips.slice(0, max) : chips;
  const hidden = chips.slice(shown.length);
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {shown.map((chip, index) => (
        <span
          key={`${chip.name}-${index}`}
          title={chipText(chip)}
          className="inline-flex max-w-full items-center gap-1 truncate rounded-md border bg-muted/40 px-1.5 py-0.5 text-xs"
        >
          <span className="text-muted-foreground">{chip.name}:</span>
          {chip.base && !compact && <span className="text-muted-foreground line-through">{chip.base}</span>}
          <span className="font-medium">
            {chip.value}
            {chip.unit ? ` ${chip.unit}` : ""}
          </span>
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.map(chipText).join("\n")}
          className="inline-flex cursor-help items-center rounded-md border border-dashed px-1.5 py-0.5 text-xs text-muted-foreground"
        >
          +{hidden.length} thay đổi
        </span>
      )}
    </div>
  );
}
