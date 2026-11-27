// [Dialog – Nhập từ file Excel] Khung chung cho nhập hàng hoá và nhập đơn hàng: chọn / kéo thả file, tải file mẫu,
// bảng lỗi theo dòng. Cả file đúng BE mới tạo, nên lỗi luôn đi kèm "chưa có gì được tạo".
'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
import { saveBlob } from '@/lib/download-file'
import { getApiErrorBody, importErrorsOf, messageForCode } from '@/lib/api/error-codes'
import type { ImportRowError } from '@/lib/api/error-codes'

// Giới hạn file khớp BE (hàng hoá và đơn hàng cùng 5MB, 1000 dòng).
const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 1000

export type ImportFileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  /** Danh từ trong thông báo: "hàng hóa", "đơn". */
  noun: string
  /** Nhãn nút nhập: "Nhập hàng hóa". */
  submitLabel: string
  templateFileName: string
  downloadTemplate: () => Promise<Blob>
  /** Gửi file; trả câu báo thành công. */
  upload: (file: File) => Promise<string>
  /** Gợi ý điền file, hiện dưới nút tải file mẫu. */
  tips: ReactNode
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ImportFileDialog({
  open,
  onOpenChange,
  title,
  description,
  noun,
  submitLabel,
  templateFileName,
  downloadTemplate,
  upload,
  tips,
}: ImportFileDialogProps) {
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

  async function handleDownload() {
    setDownloading(true)
    try {
      saveBlob(await downloadTemplate(), templateFileName)
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
      toast.success(await upload(file))
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
        toast.error(messageForCode(getApiErrorBody(err)?.code) ?? `Nhập ${noun} thất bại`)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            <p className="text-muted-foreground text-xs">File .xlsx theo mẫu, tối đa {MAX_ROWS} dòng và 5MB</p>
          </button>
        )}

        {errors.length > 0 && (
          <div className="border-destructive/40 rounded-lg border">
            <div className="text-destructive flex items-start gap-2 border-b px-4 py-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                {errorTotal} lỗi cần sửa - <strong>chưa có {noun} nào được tạo</strong>. Sửa file rồi chọn lại.
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
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={downloading} onClick={handleDownload}>
              {downloading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
              Tải file mẫu
            </Button>
          </div>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">{tips}</ul>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="cursor-pointer" disabled={importing} onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button className="cursor-pointer" disabled={!file || importing} onClick={submit}>
            {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
