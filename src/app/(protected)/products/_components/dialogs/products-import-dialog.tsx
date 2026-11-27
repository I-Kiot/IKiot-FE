// [Dialog – Nhập hàng hoá từ Excel]
'use client'

import { ImportFileDialog } from '@/components/import-file-dialog'
import { productApi } from '@/lib/api/product'
import { useProducts } from '../../_context/products-provider'

type ProductsImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsImportDialog({ open, onOpenChange }: ProductsImportDialogProps) {
  const { reloadProducts } = useProducts()

  return (
    <ImportFileDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nhập hàng hóa từ file Excel"
      description="Mỗi dòng trong file tạo một mặt hàng (SKU); các dòng cùng tên hàng hóa được gộp thành các phiên bản của một hàng hóa."
      noun="hàng hóa"
      submitLabel="Nhập hàng hóa"
      templateFileName="mau-nhap-hang-hoa.xlsx"
      downloadTemplate={productApi.downloadImportTemplate}
      upload={async (file) => {
        const result = await productApi.importFile(file)
        await reloadProducts()
        const stock = result.stockMovementIds.length
          ? `, ghi tồn kho tại ${result.stockMovementIds.length} địa điểm`
          : ''
        return `Đã nhập ${result.productCount} hàng hóa (${result.itemCount} mặt hàng)${stock}`
      }}
      tips={
        <>
          <li>
            Bắt buộc: <strong className="text-foreground">Tên hàng hóa, Giá bán, Giá vốn</strong> (cột tiêu đề màu
            đỏ, có dấu *).
          </li>
          <li>
            Nhiều phiên bản của một hàng hóa: ghi cùng tên hàng hóa trên nhiều dòng, phân biệt bằng Thuộc tính /
            Giá trị (vd. Màu: Nâu, Màu: Trắng).
          </li>
          <li>
            Danh mục, thương hiệu, nhà cung cấp chọn trong ô thả xuống - lấy từ dữ liệu hiện có của cửa hàng. Mã
            hàng, SKU bỏ trống để hệ thống tự sinh.
          </li>
          <li>
            Tồn kho: mỗi kho/chi nhánh một cột <strong className="text-foreground">Tồn kho - tên địa điểm</strong>{' '}
            ở cuối file. Bỏ trống nếu không có hàng ở đó. Mỗi địa điểm có số lượng tạo một phiếu điều chỉnh tồn kho
            đã hoàn tất (cần quyền duyệt điều chỉnh tại địa điểm đó).
          </li>
          <li>File không có ảnh - nhập xong, thêm ảnh cho hàng hóa và từng mặt hàng ngay trên màn hình này.</li>
          <li>
            Chỉ tạo hàng hóa mới, không nhập combo. Hướng dẫn chi tiết và ví dụ ở trang
            &quot;Hướng dẫn&quot; trong file mẫu.
          </li>
        </>
      }
    />
  )
}
