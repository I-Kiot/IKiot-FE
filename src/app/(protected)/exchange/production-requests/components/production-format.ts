import type {
  ProductionListRow,
  ProductionRequestStatus,
} from "@/types/order-flow";

export const STATUS_BADGE: Record<
  ProductionRequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_RECEIVED: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

/** `YYYY-MM-DD` (a date column) → `dd/mm/yyyy`, without a timezone shift. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "-";
}

export function rowLabel(
  row: Pick<ProductionListRow, "sku" | "productName" | "variantLabel">,
): string {
  const name = row.variantLabel
    ? `${row.productName} (${row.variantLabel})`
    : row.productName;
  return row.sku ? `${row.sku} · ${name}` : name;
}

/** The custom specs as one line, for the row and the request form. */
export function customizationSummary(row: ProductionListRow): string | null {
  const c = row.customization;
  if (!c) return null;
  const size = [c.lengthCm, c.widthCm, c.heightCm].some((v) => v !== null)
    ? `${c.lengthCm ?? "?"}×${c.widthCm ?? "?"}×${c.heightCm ?? "?"} cm`
    : null;
  const specs = c.specs.map(
    (s) => `${s.name}: ${s.value}${s.unit ? ` ${s.unit}` : ""}`,
  );
  return (
    [size, c.material, c.color, c.fabricCode, ...specs, c.note]
      .filter(Boolean)
      .join(" · ") || null
  );
}
