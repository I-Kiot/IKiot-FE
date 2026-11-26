import { z } from 'zod'

export type ProductsDialogType = 'add' | 'edit' | 'delete' | 'deleteMany' | 'crossBranchSearch' | 'import'

const productDetailEntrySchema = z.object({
  name: z.string(),
  value: z.string(),
  // Đơn vị của thuộc tính.
  unit: z.string().optional(),
})

// Thuộc tính khi sửa hàng hoá.
const productAttributeEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  unit: z.string().optional(),
})

// Một món của combo trên form (khớp ComboComponentRow của combo-components-field).
const comboComponentRowSchema = z.object({
  componentItemId: z.string(),
  quantity: z.number().int().min(1),
  sku: z.string(),
  productName: z.string(),
  itemType: z.enum(['PRODUCT', 'COMBO', 'SERVICE']),
  costPrice: z.number(),
})

// Schema cho form tạo/chỉnh sửa Product (item fields optional - validate thủ công khi create)
export const productFormSchema = z.object({
  name: z.string().min(1, 'Tên hàng hóa là bắt buộc'),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']),
  // Có thể đặt xưởng sản xuất (YCSX); tắt = chỉ nhập từ nhà cung cấp.
  isManufacturable: z.boolean(),
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
  // Dùng tên hàng hoá làm tên phiên bản.
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
  attributes: z.array(productAttributeEntrySchema).optional(),
  // Loại sản phẩm, chỉ chọn lúc tạo.
  productType: z.enum(['PRODUCT', 'COMBO', 'SERVICE']).optional(),
  comboComponents: z.array(comboComponentRowSchema).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

// Schema cho form tạo/chỉnh sửa ProductItem (standalone)
export const productItemFormSchema = z.object({
  // Chỉ áp dụng khi tạo mới - BE không cho sửa productName qua PATCH item.
  useParentNameForItem: z.boolean(),
  itemProductName: z.string().optional(),
  // Để trống thì BE tự sinh mã hàng / SKU.
  productCode: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  retailPrice: z.string().min(1, 'Giá bán là bắt buộc'),
  // Bắt buộc với hàng thường (kiểm thủ công khi lưu); combo thì BE tự tính từ các món.
  costPrice: z.string().optional(),
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
