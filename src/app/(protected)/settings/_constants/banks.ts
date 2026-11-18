/**
 * Ngân hàng shop chọn được làm tài khoản nhận tiền: các ngân hàng SePay hỗ trợ.
 * `value` là mã ngắn của VietQR và được lưu vào `banking.bankName`: BE ghép nó vào URL ảnh QR
 * (`img.vietqr.io/image/<bankName>-<số TK>`), nên phải đúng mã, không phải tên hiển thị.
 */
export const SUPPORTED_BANKS = [
  { value: "ACB", label: "ACB" },
  { value: "MBBank", label: "MBBank" },
  { value: "TPBank", label: "TPBank" },
  { value: "Sacombank", label: "Sacombank" },
  { value: "ShinhanBank", label: "Shinhan Bank" },
  { value: "BIDV", label: "BIDV" },
  { value: "VietinBank", label: "VietinBank" },
  { value: "VPBank", label: "VPBank" },
  { value: "Vietcombank", label: "Vietcombank" },
  { value: "KienLongBank", label: "KienlongBank" },
  { value: "MSB", label: "MSB" },
  { value: "OCB", label: "OCB" },
] as const;
