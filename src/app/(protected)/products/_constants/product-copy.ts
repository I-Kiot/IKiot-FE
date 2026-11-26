import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { ProductDetailResponse } from "@/types/product";
import type { TableCell } from "@/lib/clipboard-table";
import { STATUS_MAP } from "./product.constants";

/**
 * Chép hàng hoá theo đúng cột của file mẫu "Nhập file" (BE `products/import/product-import.columns.ts`, sheet "Hàng hóa"):
 * mỗi dòng một phiên bản (SKU), chỉ giá trị, để dán thẳng vào template. Đổi cột ở BE thì đổi ở đây.
 * Cột cấp hàng hoá được điền lại ở mọi dòng - parser chấp nhận khi các dòng khớp nhau.
 */
export const IMPORT_ATTRIBUTE_SLOTS = 3;

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  PRODUCT: "Hàng hóa",
  SERVICE: "Dịch vụ",
  COMBO: "Combo",
};

/** "Cha > Con" như cột Danh mục của template; tên trùng ở hai nhánh thì template cần đường dẫn này. */
function categoryPath(categories: readonly Category[], id: string | undefined, fallback?: string) {
  if (!id) return fallback ?? "";
  const byId = new Map(categories.map((c) => [c.id, c]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    const parent = current.parentId;
    current = byId.get(typeof parent === "string" ? parent : (parent?.id ?? ""));
  }
  return names.length > 0 ? names.join(" > ") : (fallback ?? "");
}

export function productImportRows(
  products: readonly ProductDetailResponse[],
  brands: readonly Brand[],
  categories: readonly Category[],
): TableCell[][] {
  const rows: TableCell[][] = [];
  for (const product of products) {
    const shared: TableCell[] = [
      product.name,
      PRODUCT_TYPE_LABEL[product.productType ?? "PRODUCT"] ?? product.productType,
      categoryPath(categories, product.categoryId, product.categoryName),
      brands.find((b) => b.id === product.brandId)?.name ?? "",
      STATUS_MAP[product.status]?.label ?? product.status,
      product.isManufacturable ? "Có" : "Không",
    ];
    const unitOf = new Map((product.attributes ?? []).map((a) => [a.name, a.unit ?? ""]));
    for (const item of product.items) {
      const attributes: TableCell[] = [];
      const details = item.productDetails ?? [];
      for (let n = 0; n < IMPORT_ATTRIBUTE_SLOTS; n++) {
        const detail = details[n];
        attributes.push(detail?.name ?? "", detail ? (unitOf.get(detail.name) ?? "") : "", detail?.value ?? "");
      }
      rows.push([
        ...shared,
        item.productName,
        item.productCode,
        item.sku,
        item.barcode ?? "",
        item.retailPrice,
        item.costPrice,
        item.vat ?? "",
        item.warrantyPeriod ?? "",
        (item.suppliers ?? []).map((s) => s.supplierName).join("; "),
        ...attributes,
        item.description ?? "",
      ]);
    }
  }
  return rows;
}
