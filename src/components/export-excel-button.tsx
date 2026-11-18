'use client'

import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { saveBlob } from '@/lib/download-file'

interface ExportExcelButtonProps {
  /** Gọi API xuất file; trả về nội dung file .xlsx. */
  load: () => Promise<Blob>
  filename: string
  disabled?: boolean
}

/** Nút tải báo cáo ra file Excel: file do server dựng theo đúng bộ lọc đang xem. */
export function ExportExcelButton({ load, filename, disabled }: ExportExcelButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportFile = async () => {
    setExporting(true)
    try {
      saveBlob(await load(), filename)
    } catch {
      toast.error('Xuất file thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportFile} disabled={disabled || exporting}>
      {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
      Xuất Excel
    </Button>
  )
}
