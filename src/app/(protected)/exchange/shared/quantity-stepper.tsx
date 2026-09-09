"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseNumberInput } from "@/app/(protected)/exchange/shared/qty";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className,
  inputClassName,
  disabled = false,
}: QuantityStepperProps) {
  const clamp = (next: number) => {
    let result = Number.isFinite(next) ? next : min;
    result = Math.trunc(result);
    if (result < min) result = min;
    if (typeof max === "number" && result > max) result = max;
    return result;
  };

  const canDecrease = !disabled && value > min;
  const canIncrease =
    !disabled && (typeof max !== "number" || value < max);

  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-[6.5rem] shrink-0 items-stretch overflow-hidden rounded-md border border-input bg-background",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={Number.isFinite(value) ? String(value) : ""}
        className={cn(
          "h-full min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 px-2 text-right tabular-nums",
          inputClassName,
        )}
        onChange={(e) => {
          const next = parseNumberInput(e.target.value, min);
          onChange(clamp(next));
        }}
      />
      <div className="flex w-7 shrink-0 flex-col border-l">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canIncrease}
          className="h-1/2 w-full rounded-none p-0 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onChange(clamp(value + step));
          }}
          aria-label="Tăng"
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canDecrease}
          className="h-1/2 w-full rounded-none border-t p-0 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onChange(clamp(value - step));
          }}
          aria-label="Giảm"
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>
    </div>
  );
}
