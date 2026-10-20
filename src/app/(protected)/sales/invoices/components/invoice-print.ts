import { PAYMENT_METHOD_MAP, INVOICE_TYPE_LABELS, type Invoice } from "./invoices-columns";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const escapeHtml = (value: string | null | undefined) =>
  (value ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/**
 * Opens the browser's print dialog for one issued invoice. Built from the row already on screen, so
 * printing costs no request. Every string is escaped: customer and product names are typed by users
 * and this is document.write into a window on our own origin.
 */
export function printInvoice(invoice: Invoice) {
  const win = window.open("", "_blank");
  if (!win) return false;

  const title = invoice.type === "ADJUSTMENT" ? "HÓA ĐƠN ĐIỀU CHỈNH" : "HÓA ĐƠN BÁN HÀNG";
  const number = invoice.invoiceNumber ?? invoice.invoiceCode;
  const rows = invoice.items
    .map((item, index) => {
      // `discountAmount` on a mapped invoice line is per unit.
      const total = item.quantity * (item.unitPrice - item.discountAmount);
      return `<tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${formatVND(item.unitPrice)}</td>
        <td class="right">${item.discountAmount > 0 ? `-${formatVND(item.discountAmount * item.quantity)}` : "-"}</td>
        <td class="right">${formatVND(total)}</td>
      </tr>`;
    })
    .join("");

  const discount = invoice.discountValue && invoice.discountValue > 0 ? invoice.discountValue : 0;
  const promotions =
    invoice.discountType === "PROMOTION" && invoice.appliedPromotions?.length
      ? invoice.appliedPromotions
          .map(
            (p) =>
              `<div class="row sub"><span>• ${escapeHtml(p.promoName)}</span><span>-${formatVND(p.discountAmount)}</span></div>`,
          )
          .join("")
      : "";

  win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)} - ${escapeHtml(number)}</title>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; padding: 24px; color: #000; font-size: 13px; }
      h1 { font-size: 20px; text-align: center; margin: 0 0 4px; }
      .meta { text-align: center; margin-bottom: 16px; color: #444; line-height: 1.6; }
      .info { line-height: 1.7; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
      th { background: #f2f2f2; }
      .right { text-align: right; } .center { text-align: center; }
      .totals { margin-top: 14px; margin-left: auto; width: 320px; }
      .row { display: flex; justify-content: space-between; padding: 3px 0; }
      .row.sub { color: #555; font-size: 12px; padding-left: 10px; }
      .row.bold { font-weight: bold; border-top: 1px solid #000; margin-top: 6px; padding-top: 8px; }
      .footer { margin-top: 28px; text-align: center; font-style: italic; font-size: 11px; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="meta">
      Số: <b>${escapeHtml(number)}</b>${invoice.type === "ADJUSTMENT" ? ` (${escapeHtml(INVOICE_TYPE_LABELS.ADJUSTMENT)} cho đơn ${escapeHtml(invoice.orderCode)})` : ` · Đơn ${escapeHtml(invoice.orderCode)}`}<br />
      Ngày: ${new Date(invoice.createdAt).toLocaleString("vi-VN")}
    </div>
    <div class="info">
      Khách hàng: <b>${escapeHtml(invoice.customer.name)}</b>${invoice.customer.phone ? ` · ${escapeHtml(invoice.customer.phone)}` : ""}<br />
      Người bán: ${escapeHtml(invoice.seller.name)}<br />
      Thanh toán: ${invoice.paymentMethod ? escapeHtml(PAYMENT_METHOD_MAP[invoice.paymentMethod]) : "-"}
    </div>
    <table>
      <thead><tr><th class="center">#</th><th>Hàng hóa</th><th class="right">SL</th><th class="right">Đơn giá</th><th class="right">Giảm giá</th><th class="right">Thành tiền</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      ${discount ? `<div class="row"><span>Tạm tính</span><span>${formatVND(invoice.grandTotal + discount)}</span></div><div class="row"><span>Chiết khấu</span><span>-${formatVND(discount)}</span></div>${promotions}` : ""}
      <div class="row bold"><span>Tổng thanh toán</span><span>${formatVND(invoice.grandTotal)}</span></div>
      ${invoice.customerPay !== null ? `<div class="row"><span>Khách thanh toán</span><span>${formatVND(invoice.customerPay)}</span></div>` : ""}
      ${invoice.change !== null ? `<div class="row"><span>Tiền thừa</span><span>${formatVND(invoice.change)}</span></div>` : ""}
    </div>
    ${invoice.note ? `<div class="info">Ghi chú: ${escapeHtml(invoice.note)}</div>` : ""}
    <div class="footer">Cảm ơn quý khách!</div>
    <script>window.onload = function () { window.print(); window.close(); };</script>
  </body>
</html>`);
  win.document.close();
  return true;
}
