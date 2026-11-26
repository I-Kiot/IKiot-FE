/** Ngân hàng nhận tiền được SePay hỗ trợ; `value` là mã VietQR. */
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
