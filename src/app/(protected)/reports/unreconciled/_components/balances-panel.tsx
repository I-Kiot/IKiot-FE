// Số dư ngoài két chi nhánh: để đọc khi chốt két lệch, không cần xử lý.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Unreconciled } from '@/lib/api/stats'
import { categoryLabel, formatNumber, formatVND, negativeClass } from '@/lib/stats-format'
import { TONE_TEXT } from '../../../dashboard/shared/tones'
import { Empty, Panel } from './shared'

function InOut({ inLabel, outLabel, inValue, outValue }: { inLabel: string; outLabel: string; inValue: number; outValue: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">{inLabel}</p>
        <p className={`font-semibold tabular-nums ${TONE_TEXT.emerald}`}>{formatVND(inValue)}</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">{outLabel}</p>
        <p className={`font-semibold tabular-nums ${TONE_TEXT.red}`}>{formatVND(outValue)}</p>
      </div>
    </div>
  )
}

export function BalancesPanel({ data }: { data: Unreconciled }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tiền hợp lệ nhưng không đi qua két nào. Đọc phần này để giải thích chênh lệch khi chốt két; không có gì phải xử lý.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.unallocatedBank && (
          <Panel
            title="Tiền về ngân hàng chưa gắn đơn"
            description="Tiền khách chuyển vào tài khoản của shop mà chưa gắn được đơn nào (đã trừ phần hoàn)"
            total={formatVND(data.unallocatedBank.net)}
          >
            <InOut inLabel="Tiền về" outLabel="Đã hoàn" inValue={data.unallocatedBank.receipts} outValue={data.unallocatedBank.refunds} />
          </Panel>
        )}

        <Panel
          title="Quỹ chủ"
          description="Tiền shipper nộp thẳng cho chủ và tiền mặt trả nhà cung cấp, không qua két chi nhánh"
          total={formatVND(data.ownerFund.balance)}
        >
          <InOut inLabel="Tiền vào" outLabel="Tiền ra" inValue={data.ownerFund.income} outValue={data.ownerFund.expense} />
          {data.ownerFund.byCategory.length > 0 && (
            <ul className="space-y-1 text-sm">
              {data.ownerFund.byCategory.map((row) => (
                <li key={`${row.category}-${row.flowType}`} className="flex justify-between gap-3">
                  <span>
                    {categoryLabel(row.category)} <span className="text-xs text-muted-foreground">({row.count})</span>
                  </span>
                  <span className={`tabular-nums ${row.flowType === 'INCOME' ? TONE_TEXT.emerald : TONE_TEXT.red}`}>
                    {row.flowType === 'INCOME' ? '+' : '−'}
                    {formatVND(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Tiền mặt tại quầy kho"
          description="Khách tới kho nhận hàng và trả tiền mặt. Kho không có két nên khoản này không nằm trong két nào"
          total={formatVND(data.warehouseCounterCash.net)}
        >
          {data.warehouseCounterCash.items.length === 0 ? (
            <Empty text="Chưa có tiền mặt thu tại quầy kho." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kho</TableHead>
                  <TableHead className="text-right">Thu</TableHead>
                  <TableHead className="text-right">Chi</TableHead>
                  <TableHead className="text-right">Ròng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.warehouseCounterCash.items.map((item) => (
                  <TableRow key={item.locationId}>
                    <TableCell>{item.locationName ?? 'Kho'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVND(item.income)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVND(item.expense)}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${negativeClass(item.net)}`}>{formatVND(item.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel
          title="Hoàn tiền mặt trừ vào két chi nhánh"
          description="Đơn thu qua shipper hoặc quầy kho nhưng hoàn bằng tiền mặt từ két chi nhánh: két hụt đúng bằng số này khi chốt"
          total={`${formatNumber(data.cashRefundsAgainstDrawer.count)} lần · ${formatVND(data.cashRefundsAgainstDrawer.amount)}`}
        >
          {data.cashRefundsAgainstDrawer.items.length === 0 ? (
            <Empty text="Không có khoản hoàn nào như vậy." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nơi đặt két</TableHead>
                  <TableHead className="text-right">Số lần</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cashRefundsAgainstDrawer.items.map((item) => (
                  <TableRow key={item.locationId}>
                    <TableCell>{item.locationName ?? 'Chi nhánh'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(item.count)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatVND(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </div>
  )
}
