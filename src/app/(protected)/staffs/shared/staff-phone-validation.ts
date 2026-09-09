/** Align with BE StaffPhoneNumberValidator */

const VIETNAM_MOBILE_PHONE_REGEX =
  /^(?:03[2-9]|05[25689]|07[06789]|08[1-9]|09\d)\d{7}$/;

const SPECIAL_PHONE_NUMBER_RULES: Array<{ regex: RegExp; message: string }> = [
  {
    regex: /^065\d{7}$/,
    message:
      "Đầu số 065 dành cho dịch vụ điện thoại Internet (VoIP), không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^067\d{7}$/,
    message:
      "Đầu số 067 dành cho dịch vụ điện thoại vệ tinh (VSAT), không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^069[2-9]\d{6}$/,
    message:
      "Đầu số 069 dành cho mạng dùng riêng của cơ quan Đảng, Nhà nước, Công an và Quân đội, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^080\d{7}$/,
    message:
      "Đầu số 080 dành cho dịch vụ của Cục Bưu điện Trung ương, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^111$/,
    message:
      "Số 111 là Tổng đài điện thoại quốc gia bảo vệ trẻ em, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^112$/,
    message:
      "Số 112 là tổng đài ứng cứu khẩn cấp, tìm kiếm cứu nạn toàn quốc, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^113$/,
    message:
      "Số 113 là số điện thoại khẩn cấp của Công an, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^114$/,
    message:
      "Số 114 là số điện thoại khẩn cấp về cứu hỏa và cứu nạn, cứu hộ, không được phép sử dụng làm số di động của nhân viên",
  },
  {
    regex: /^115$/,
    message:
      "Số 115 là số điện thoại cấp cứu y tế, không được phép sử dụng làm số di động của nhân viên",
  },
];

/** Chuẩn hóa về 10 số bắt đầu bằng 0 (bỏ +84 / 84). */
export function normalizeStaffPhoneNumber(value?: string): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits.slice(0, 10);
}

export function validateStaffPhoneNumber(value?: string): string | null {
  const normalized = normalizeStaffPhoneNumber(value);
  if (!normalized) return "Số điện thoại là bắt buộc";

  const special = SPECIAL_PHONE_NUMBER_RULES.find(({ regex }) =>
    regex.test(normalized),
  );
  if (special) return special.message;

  if (!/^\d{10}$/.test(normalized)) {
    return "Số điện thoại phải gồm đúng 10 chữ số";
  }
  if (!VIETNAM_MOBILE_PHONE_REGEX.test(normalized)) {
    return "Đầu số điện thoại di động Việt Nam không hợp lệ";
  }
  return null;
}
