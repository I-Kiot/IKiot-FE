import type { HistoryPerson } from "@/types/history";

/** Tên người làm một thay đổi; `null` = hệ thống (hoặc nhãn riêng của từng màn). */
export function historyPersonLabel(person: HistoryPerson | null | undefined, systemLabel = "Hệ thống"): string {
  if (!person) return systemLabel;
  const name = [person.profile?.lastName, person.profile?.firstName].filter(Boolean).join(" ").trim();
  return name || person.phoneNumber || systemLabel;
}
