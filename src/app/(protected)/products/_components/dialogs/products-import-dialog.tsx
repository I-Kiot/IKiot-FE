// [Dialog – Import Products from Excel]
'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { productApi } from '@/lib/api/product'
import { getApiErrorBody, importErrorsOf, messageForCode } from '@/lib/api/error-codes'
import type { ImportRowError } from '@/lib/api/error-codes'
import { useProducts } from '../../_context/products-provider'

// Khớp MAX_IMPORT_BYTES / MAX_IMPORT_ROWS của BE (product-import.columns.ts). BE vẫn kiểm lại -
// kiểm ở đây chỉ để không phải đợi upload xong mới biết chọn nhầm file.
const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 1000
const TEMPLATE_FILE_NAME = 'mau-nhap-hang-hoa.xlsx'

type ProductsImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ProductsImportDialog({ open, onOpenChange }: ProductsImportDialogProps) {
  const { reloadProducts } = useProducts()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [errors, setErrors] = useState<ImportRowError[]>([])
  const [errorTotal, setErrorTotal] = useState(0)

  function reset() {
    setFile(null)
    setErrors([])
    setErrorTotal(0)
    setDragging(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleOpenChange(next: boolean) {
    if (importing) return
    if (!next) reset()
    onOpenChange(next)
  }

  function pick(candidate: File | undefined) {
    if (!candidate) return
    setErrors([])
    setErrorTotal(0)
    if (!/\.xlsx$/i.test(candidate.name)) {
      toast.error('Chỉ nhận file Excel .xlsx - hãy dùng file mẫu')
      return
    }
    if (candidate.size > MAX_BYTES) {
      toast.error('File vượt quá 5MB - chia nhỏ file rồi nhập nhiều lần')
      return
    }
    setFile(candidate)
  }

  async function downloadTemplate() {
    setDownloading(true)
    try {
      const blob = await productApi.downloadImportTemplate()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = TEMPLATE_FILE_NAME
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Tải file mẫu thất bại')
    } finally {
      setDownloading(false)
    }
  }

  async function submit() {
    if (!file) return
    setImporting(true)
    setErrors([])
    setErrorTotal(0)
    try {
      const result = await productApi.importFile(file)
      await reloadProducts()
      toast.success(`Đã nhập ${result.productCount} hàng hóa (${result.itemCount} mặt hàng)`)
      reset()
      onOpenChange(false)
    } catch (err) {
      const { errors: rowErrors, total } = importErrorsOf(err)
      if (rowErrors.length > 0) {
        setErrors(rowErrors)
        setErrorTotal(total)
      } else if ((err as { response?: { status?: number } })?.response?.status === 413) {
        toast.error('File vượt quá 5MB - chia nhỏ file rồi nhập nhiều lần')
      } else {
        toast.error(messageForCode(getApiErrorBody(err)?.code) ?? 'Nhập hàng hóa thất bại')
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập hàng hóa từ file Excel</DialogTitle>
          <DialogDescription>
            Mỗi dòng trong file tạo một mặt hàng (SKU); các dòng cùng tên hàng hóa được gộp thành các
            phiên bản của một hàng hóa.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FileSpreadsheet className="size-8 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-muted-foreground text-xs">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              disabled={importing}
              onClick={reset}
              aria-label="Bỏ chọn file"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
            )}
          >
            <Upload className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
            <p className="text-muted-foreground text-xs">
              File .xlsx theo mẫu, tối đa {MAX_ROWS} dòng và 5MB
            </p>
          </button>
        )}

        {errors.length > 0 && (
          <div className="border-destructive/40 rounded-lg border">
            <div className="text-destructive flex items-start gap-2 border-b px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                {errorTotal} lỗi cần sửa - <strong>chưa có hàng hóa nào được tạo</strong>. Sửa file rồi
                chọn lại.
                {errorTotal > errors.length && ` (Đang hiển thị ${errors.length} lỗi đầu tiên.)`}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left">
                    <th className="w-16 px-4 py-2 font-medium">Dòng</th>
                    <th className="w-36 px-2 py-2 font-medium">Cột</th>
                    <th className="px-2 py-2 font-medium">Lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((error, i) => (
                    <tr key={i} className="border-t align-top">
                      <td className="px-4 py-2 tabular-nums">{error.row ?? '-'}</td>
                      <td className="text-muted-foreground px-2 py-2">{error.column ?? '-'}</td>
                      <td className="px-2 py-2">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-muted/40 space-y-3 rounded-lg p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Chưa có file mẫu?</p>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={downloading}
              onClick={downloadTemplate}
            >
              {downloading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Tải file mẫu
            </Button>
          </div>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>
              Bắt buộc: <strong className="text-foreground">Tên hàng hóa, Giá bán, Giá vốn</strong> (cột
              tiêu đề màu đỏ, có dấu *).
            </li>
            <li>
              Nhiều phiên bản của một hàng hóa: ghi cùng tên hàng hóa trên nhiều dòng, phân biệt bằng
              Thuộc tính / Giá trị (vd. Màu: Nâu, Màu: Trắng).
            </li>
            <li>
              Danh mục, thương hiệu, nhà cung cấp chọn trong ô thả xuống - lấy từ dữ liệu hiện có của
              cửa hàng. Mã hàng, SKU bỏ trống để hệ thống tự sinh.
            </li>
            <li>
              File không có ảnh - nhập xong, thêm ảnh cho hàng hóa và từng mặt hàng ngay trên màn hình
              này.
            </li>
            <li>
              Chỉ tạo hàng hóa mới, không nhập tồn kho, không nhập combo. Hướng dẫn chi tiết và ví dụ ở
              trang &quot;Hướng dẫn&quot; trong file mẫu.
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={importing}
            onClick={() => handleOpenChange(false)}
          >
            Hủy
          </Button>
          <Button className="cursor-pointer" disabled={!file || importing} onClick={submit}>
            {importing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Nhập hàng hóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
