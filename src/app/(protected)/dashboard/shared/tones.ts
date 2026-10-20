// Bảng màu nhấn của dashboard: một chỗ duy nhất giữ cặp màu sáng/tối cho ô icon và chữ trạng thái,
// để các widget không tự rải class màu và lệch nhau ở chế độ tối.

export type Tone = "orange" | "blue" | "violet" | "emerald" | "amber" | "red" | "sky" | "slate";

/** Ô vuông nền nhạt chứa icon. */
export const TONE_TILE: Record<Tone, string> = {
  orange: "bg-orange-500/10 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  red: "bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-300",
  sky: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  slate: "bg-muted text-muted-foreground",
};

/** Chữ màu (số đếm, mũi tên tăng giảm). */
export const TONE_TEXT: Record<Tone, string> = {
  orange: "text-orange-600 dark:text-orange-300",
  blue: "text-blue-600 dark:text-blue-300",
  violet: "text-violet-600 dark:text-violet-300",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-red-600 dark:text-red-400",
  sky: "text-sky-600 dark:text-sky-300",
  slate: "text-muted-foreground",
};

/** Màu nhấn của biểu đồ doanh thu (cam như ảnh thiết kế), có bản cho nền tối. */
export const CHART_ACCENT = { light: "oklch(0.646 0.222 41.116)", dark: "oklch(0.75 0.183 55.934)" };
