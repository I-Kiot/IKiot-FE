import { cn } from "@/lib/utils";

type Props = {
  count: number;
  /** Câu cho trình đọc màn hình, vd. "3 đơn cần chú ý". */
  label: string;
  className?: string;
};

/** Badge số đỏ tròn; số 0 thì không vẽ. */
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
