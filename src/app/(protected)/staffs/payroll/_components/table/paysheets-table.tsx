'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Settings2 } from 'lucide-react'
import { usePayroll } from '../../_context/payroll-provider'
import { formatVND } from '../../_constants/payroll.constants'
import type { PaySheet } from '@/types/payroll'

export function PaysheetsTable() {
  const { paysheets, setActivePaysheetId } = usePayroll()

  if (paysheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-white dark:bg-slate-900/10">
        <Settings2 className="size-10 text-muted-foreground mb-4" />
        <h3 className="text-md font-semibold">Chưa có mức lương cơ bản nào được cấu hình</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Nhấp thiết lập lương cơ bản để gán mức thu nhập định kỳ cho nhân viên của bạn.
        </p>
      </div>
    )
  }

  function handleEdit(paysheet: PaySheet) {
    setActivePaysheetId(paysheet.id)
  }

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khung lương</TableHead>
            <TableHead>Hình thức chi trả</TableHead>
            <TableHead className="text-right">Lương định mức</TableHead>
            <TableHead>Phụ cấp</TableHead>
            <TableHead>Khấu trừ</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paysheets.map((sheet) => {
            const payType = sheet.basicPay?.payType
            let payTypeLabel = '-'
            let salaryLabel = '-'

            if (payType === 'FIXED') {
              payTypeLabel = 'Lương cố định'
              salaryLabel = formatVND(sheet.basicPay?.salaryPerPeriod || 0)
            } else if (payType === 'PAY_BY_SHIFT') {
              payTypeLabel = 'Theo ca làm việc'
              salaryLabel = `${formatVND(sheet.basicPay?.amountPerShift || 0)}/ca`
            } else if (payType === 'STANDARD_WORKING_DAY') {
              payTypeLabel = 'Theo ngày công chuẩn'
              salaryLabel = `${formatVND(sheet.basicPay?.salaryPerPeriod || 0)}/kỳ`
            }

            const allowancesLabel = (sheet.allowances || [])
              .filter((a) => a.enable)
              .map((a) => a.name)
              .join(', ') || 'Không có'

            const deductionsLabel = (sheet.deductions || [])
              .filter((d) => d.enable)
              .map((d) => d.name)
              .join(', ') || 'Không có'

            return (
              <TableRow key={sheet.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{sheet.name}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{payTypeLabel}</TableCell>
                <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {salaryLabel}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300 text-sm max-w-[150px] truncate" title={allowancesLabel}>
                  {allowancesLabel}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300 text-sm max-w-[150px] truncate" title={deductionsLabel}>
                  {deductionsLabel}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString('vi-VN') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-primary hover:bg-primary/10"
                    onClick={() => handleEdit(sheet)}
                  >
                    <Pencil className="mr-1.5 size-3.5" />
                    Chỉnh sửa
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
