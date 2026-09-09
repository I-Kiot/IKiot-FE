// [UI Types – Product]
import { z } from 'zod'

export type ProductsDialogType = 'add' | 'edit' | 'delete' | 'deleteMany' | 'crossBranchSearch'

const productDetailEntrySchema = z.object({
  name: z.string(),
  value: z.string(),
})

// Schema cho form tạo/chỉnh sửa Product (item fields optional - validate thủ công khi create)
export const productFormSchema = z.object({
  name: z.string().min(1, 'Tên hàng hóa là bắt buộc'),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']),
  images: z
    .array(
      z.object({
        url: z.string(),
        isThumbnail: z.boolean(),
      }),
    )
    .optional(),
  // --- Phiên bản đầu tiên ---
  itemImages: z
    .array(z.object({ url: z.string(), isThumbnail: z.boolean() }))
    .optional(),
  // Tên phiên bản: mặc định dùng tên hàng hóa (name) ở trên; nếu false thì
  // dùng itemProductName riêng (bắt buộc, validate thủ công khi tạo).
  useParentNameForItem: z.boolean(),
  itemProductName: z.string().optional(),
  productCode: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  retailPrice: z.string().optional(),
  costPrice: z.string().optional(),
  vat: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  description: z.string().optional(),
  productDetails: z.array(productDetailEntrySchema).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

// Schema cho form tạo/chỉnh sửa ProductItem (standalone)
export const productItemFormSchema = z.object({
  // Chỉ áp dụng khi tạo mới - BE không cho sửa productName qua PATCH item.
  useParentNameForItem: z.boolean(),
  itemProductName: z.string().optional(),
  productCode: z.string().min(1, 'Mã hàng là bắt buộc'),
  sku: z.string().min(1, 'SKU là bắt buộc'),
  barcode: z.string().optional(),
  retailPrice: z.string().min(1, 'Giá bán là bắt buộc'),
  costPrice: z.string().min(1, 'Giá vốn là bắt buộc'),
  vat: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  description: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        isThumbnail: z.boolean(),
      }),
    )
    .optional(),
  productDetails: z.array(productDetailEntrySchema).optional(),
})

export type ProductItemFormValues = z.infer<typeof productItemFormSchema>
