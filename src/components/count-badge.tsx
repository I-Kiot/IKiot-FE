import { cn } from "@/lib/utils";

type Props = {
  count: number;
  /** Câu cho trình đọc màn hình, vd. "3 đơn cần chú ý". */
  label: string;
  className?: string;
};

/**
 * Badge tròn nền đỏ, số trắng: dùng cho số cảnh báo trên sidebar và trên nút. Số 0 thì không vẽ gì.
 * `min-w` + `px` để 1 chữ số ra hình tròn, 2 chữ số / "99+" giãn thành viên thuốc.
 * Là `span` chứ không phải svg, nên các nút sidebar (vốn ép màu mọi svg con) không đè mất màu đỏ.
 */
export function CountBadge({ count, label, className }: Props) {
  if (count <= 0) return null;

  let text = String(count);
  if (count > 99) text = "99+";

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-none text-white tabular-nums dark:bg-red-500",
        className,
      )}
      aria-label={label}
    >
      {text}
    </span>
  );
}
