import type { RefinementCtx } from "zod";

/** Giá nhập tối đa: 1000 tỷ VND */
export const MAX_IMPORT_PRICE = 1_000_000_000_000

/** Zod superRefine: không cho chọn trùng productItemId trong details. */
export function refineDuplicateProducts(
  details: { productItemId?: string }[],
  ctx: RefinementCtx,
) {
  const seen = new Set<string>()
  details.forEach((d, idx) => {
    if (!d.productItemId) return
    if (seen.has(d.productItemId)) {
      ctx.addIssue({
        code: "custom",
        message: "Không được chọn trùng hàng hóa",
        path: ["details", idx, "productItemId"],
      })
    }
    seen.add(d.productItemId)
  })
}

export type MovementDetailInput = {
  productItemId: string
  quantity: number
  importPrice?: number
  note?: string
}

export type OpeningRowFieldErrors = {
  productItemId?: string
  quantity?: string
  importPrice?: string
}

/** Parse ô giá - chỉ lấy chữ số, clamp ≤ 1000 tỷ (tránh số quá lớn làm vỡ UI). */
export function parseImportPriceInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "").slice(0, 13)
  if (!digits) return 0
  const n = Number(digits)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, MAX_IMPORT_PRICE)
}

export function formatMoneyVnd(value: number): string {
  if (!Number.isFinite(value)) return "-"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value)
}

export function findDuplicateProductIds(details: { productItemId: string }[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const d of details) {
    if (!d.productItemId) continue
    if (seen.has(d.productItemId)) dupes.add(d.productItemId)
    seen.add(d.productItemId)
  }
  return [...dupes]
}

/** Lỗi theo từng dòng - hiện ngay dưới field. */
export function getOpeningRowFieldErrors(
  details: MovementDetailInput[],
  options: {
    requireImportPrice: boolean
    /** productItemId → giá bán (retailPrice) để chặn giá nhập > giá bán */
    retailPriceByItemId?: Record<string, number>
  },
): OpeningRowFieldErrors[] {
  const dupes = new Set(findDuplicateProductIds(details))
  return details.map((d) => {
    const err: OpeningRowFieldErrors = {}
    if (!d.productItemId?.trim()) {
      err.productItemId = "Vui lòng chọn hàng hóa"
    } else if (dupes.has(d.productItemId)) {
      err.productItemId = "Không được chọn trùng hàng hóa"
    }
    if (!Number.isFinite(d.quantity) || d.quantity <= 0) {
      err.quantity = "Số lượng phải > 0"
    }
    if (options.requireImportPrice) {
      const price = d.importPrice ?? 0
      const retail = options.retailPriceByItemId?.[d.productItemId]
      if (!Number.isFinite(price) || price <= 0) {
        err.importPrice = "Giá nhập phải > 0"
      } else if (price > MAX_IMPORT_PRICE) {
        err.importPrice = "Giá nhập tối đa 1000 tỷ"
      } else if (
        typeof retail === "number" &&
        Number.isFinite(retail) &&
        retail > 0 &&
        price > retail
      ) {
        err.importPrice = `Giá nhập không được cao hơn giá bán (${new Intl.NumberFormat("vi-VN").format(retail)} đ)`
      }
    }
    return err
  })
}

export function hasOpeningRowFieldErrors(errors: OpeningRowFieldErrors[]): boolean {
  return errors.some((e) => !!(e.productItemId || e.quantity || e.importPrice))
}

export type MovementDetailValidateOptions = {
  requireImportPrice: boolean
  /** productItemId → retailPrice (khớp BE: importPrice ≤ retailPrice) */
  retailPriceByItemId?: Record<string, number>
}

/** Build map giá bán từ danh sách product options (search / catalog). */
export function buildRetailPriceByItemId(
  products: { id: string; retailPrice?: number }[],
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const p of products) {
    if (
      typeof p.retailPrice === "number" &&
      Number.isFinite(p.retailPrice) &&
      p.retailPrice > 0
    ) {
      map[p.id] = p.retailPrice
    }
  }
  return map
}

/** EXPORT/RETURN: BE chỉ cần quantity > 0 (+ stock). IMPORT: cần importPrice ≤ retailPrice. */
export function validateOpeningDetailsSubmit(
  details: MovementDetailInput[],
  options: MovementDetailValidateOptions,
): string | null {
  return validateMovementDetails(details, options)
}

/** Validate line items before create / update details. */
export function validateMovementDetails(
  details: MovementDetailInput[],
  options: MovementDetailValidateOptions,
): string | null {
  const errors = getOpeningRowFieldErrors(details, options)
  if (details.length === 0 || details.every((d) => !d.productItemId)) {
    return "Cần ít nhất 1 mặt hàng"
  }
  if (hasOpeningRowFieldErrors(errors)) {
    const first = errors.find((e) => e.importPrice || e.quantity || e.productItemId)
    return first?.importPrice || first?.quantity || first?.productItemId || "Dữ liệu không hợp lệ"
  }
  return null
}

export function validateReceiveDetails(
  details: { productItemId: string; receivedQuantity: number }[],
): string | null {
  if (details.length === 0) return "Không có mặt hàng để nhận"
  if (details.some((d) => d.receivedQuantity < 0)) {
    return "Số lượng thực nhận không được âm"
  }
  return null
}
