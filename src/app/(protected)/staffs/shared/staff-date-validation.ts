import {
  addYears,
  differenceInYears,
  isValid,
  parseISO,
  startOfDay,
  subYears,
} from "date-fns";

export const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MIN_STAFF_AGE = 16;
export const MIN_BIRTH_YEAR = 1900;
export const MIN_HIRE_YEAR = 1970;
export const MAX_HIRE_YEARS_AHEAD = 5;

export function parseDateInput(value?: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!DATE_INPUT_PATTERN.test(trimmed)) return null;

  const parsed = parseISO(`${trimmed}T00:00:00`);
  if (!isValid(parsed)) return null;

  // Reject impossible calendar dates such as 2026-02-30.
  const [year, month, day] = trimmed.split("-").map(Number);
  return parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
    ? parsed
    : null;
}

export function isValidDateInput(value?: string): boolean {
  return parseDateInput(value) !== null;
}

export function validateOptionalDob(value?: string): {
  ok: boolean;
  message?: string;
} {
  const trimmed = value?.trim();
  if (!trimmed) return { ok: true };

  if (!DATE_INPUT_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message: "Ngày sinh phải đủ định dạng ngày/tháng/năm (YYYY-MM-DD)",
    };
  }

  const dob = parseDateInput(trimmed);
  if (!dob) {
    return { ok: false, message: "Ngày sinh không hợp lệ" };
  }

  const today = startOfDay(new Date());
  if (dob > today) {
    return { ok: false, message: "Ngày sinh không được ở tương lai" };
  }

  if (dob.getFullYear() < MIN_BIRTH_YEAR) {
    return {
      ok: false,
      message: `Năm sinh phải từ ${MIN_BIRTH_YEAR} trở lên`,
    };
  }

  const age = differenceInYears(today, dob);
  if (age < MIN_STAFF_AGE) {
    return {
      ok: false,
      message: `Nhân viên phải đủ ${MIN_STAFF_AGE} tuổi trở lên`,
    };
  }

  return { ok: true };
}

export function validateOptionalHireDate(
  value?: string,
  dob?: string,
): { ok: boolean; message?: string } {
  const trimmed = value?.trim();
  if (!trimmed) return { ok: true };

  if (!DATE_INPUT_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message: "Ngày vào làm phải đủ định dạng ngày/tháng/năm (YYYY-MM-DD)",
    };
  }

  const hireDate = parseDateInput(trimmed);
  if (!hireDate) {
    return { ok: false, message: "Ngày vào làm không hợp lệ" };
  }

  if (hireDate.getFullYear() < MIN_HIRE_YEAR) {
    return {
      ok: false,
      message: `Ngày vào làm phải từ năm ${MIN_HIRE_YEAR} trở lên`,
    };
  }

  const today = startOfDay(new Date());
  const maxHireDate = startOfDay(addYears(today, MAX_HIRE_YEARS_AHEAD));
  if (hireDate > maxHireDate) {
    return {
      ok: false,
      message: `Ngày vào làm không được quá ${MAX_HIRE_YEARS_AHEAD} năm so với hiện tại`,
    };
  }

  const dobDate = parseDateInput(dob);
  if (dobDate && hireDate < dobDate) {
    return {
      ok: false,
      message: "Ngày vào làm không được trước ngày sinh",
    };
  }

  if (dobDate) {
    const ageAtHire = differenceInYears(hireDate, dobDate);
    if (ageAtHire < MIN_STAFF_AGE) {
      return {
        ok: false,
        message: `Ngày vào làm phải sau khi nhân viên đủ ${MIN_STAFF_AGE} tuổi`,
      };
    }
  }

  return { ok: true };
}

export function normalizeDateInput(value?: string): string | undefined {
  const parsed = parseDateInput(value);
  if (!parsed) return undefined;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDobInputBounds() {
  const today = startOfDay(new Date());
  return {
    min: formatDateForInput(subYears(today, 100)),
    max: formatDateForInput(today),
  };
}

export function getHireDateInputBounds() {
  const today = startOfDay(new Date());
  return {
    min: `${MIN_HIRE_YEAR}-01-01`,
    max: formatDateForInput(addYears(today, MAX_HIRE_YEARS_AHEAD)),
  };
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidTaxNumber(value?: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return true;
  return digits.length >= 10 && digits.length <= 14;
}

export function parseTaxNumber(value?: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 14);
}
