export const CCCD_LENGTH = 12;

/** Align with BE StaffIdentificationValidator */
const VIETNAM_PROVINCE_CODES = new Set([
  "001", "002", "004", "006", "008", "010", "011", "012", "014",
  "015", "017", "019", "020", "022", "024", "025", "026", "027",
  "030", "031", "033", "034", "035", "036", "037", "038", "040",
  "042", "044", "045", "046", "048", "049", "051", "052", "054",
  "056", "058", "060", "062", "064", "066", "067", "068", "070",
  "072", "074", "075", "077", "079", "080", "082", "083", "084",
  "086", "087", "089", "091", "092", "093", "094", "095", "096",
]);

export function parseIdentificationId(value?: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, CCCD_LENGTH);
}

/** CCCD 12 số - nhóm 3 chữ số: 079 201 000 001 */
export function formatIdentificationId(value?: string | null): string {
  const digits = parseIdentificationId(value ?? "");
  if (!digits) return "";

  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function getBirthYearFromCccd(centuryGenderCode: number, yearSuffix: string) {
  const centuryStart = 1900 + Math.floor(centuryGenderCode / 2) * 100;
  return centuryStart + Number(yearSuffix);
}

/**
 * @param required - tạo NV: bắt buộc; sửa: rỗng = bỏ qua (không đổi).
 */
export function validateStaffIdentificationId(
  value?: string,
  opts?: {
    required?: boolean;
    dob?: string;
    gender?: string;
  },
): string | null {
  const digits = parseIdentificationId(value);
  const required = opts?.required ?? false;

  if (!digits) {
    return required ? "Số căn cước là bắt buộc" : null;
  }
  if (digits.length !== CCCD_LENGTH) {
    return "Số căn cước phải gồm đúng 12 chữ số";
  }

  const provinceCode = digits.slice(0, 3);
  if (!VIETNAM_PROVINCE_CODES.has(provinceCode)) {
    return "Mã nơi đăng ký khai sinh trên số căn cước không hợp lệ";
  }

  const centuryGenderCode = Number(digits[3]);
  const birthYear = getBirthYearFromCccd(centuryGenderCode, digits.slice(4, 6));

  const dob = opts?.dob?.trim();
  if (dob) {
    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      return "Ngày sinh của nhân viên không hợp lệ";
    }
    if (parsedDob.getUTCFullYear() !== birthYear) {
      return "Năm sinh trên số căn cước không khớp với ngày sinh của nhân viên";
    }
  }

  const gender = opts?.gender;
  if (gender === "MALE" && centuryGenderCode % 2 !== 0) {
    return "Giới tính trên số căn cước không khớp với giới tính của nhân viên";
  }
  if (gender === "FEMALE" && centuryGenderCode % 2 !== 1) {
    return "Giới tính trên số căn cước không khớp với giới tính của nhân viên";
  }

  return null;
}
