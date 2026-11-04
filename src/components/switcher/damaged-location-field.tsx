"use client"

import type { Control, FieldValues, Path } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Radix Select không nhận giá trị rỗng, nên "không có kho hàng hỏng" dùng giá trị sentinel này. */
export const NO_DAMAGED_LOCATION = "__none__"

export interface DamagedLocationOption {
  id: string
  name: string
}

interface DamagedLocationFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  /** Các kho không bán được mà chủ shop có thể chọn (địa điểm hiện tại đã bị loại). */
  options: DamagedLocationOption[]
}

/** D-4: hàng hỏng / lỗi của địa điểm này được chuyển tới đâu (`damagedLocationId`). */
export function DamagedLocationField<T extends FieldValues>({
  control,
  name,
  options,
}: DamagedLocationFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Kho hàng hỏng mặc định (Tùy chọn)</FormLabel>
          <Select
            onValueChange={(v) => field.onChange(v === NO_DAMAGED_LOCATION ? "" : v)}
            value={field.value || NO_DAMAGED_LOCATION}
          >
            <FormControl>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue placeholder="Chưa chọn" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NO_DAMAGED_LOCATION}>Chưa chọn</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {options.length === 0
              ? "Chưa có kho hàng hỏng nào. Tạo một kho và bật “Kho hàng hỏng” để chọn tại đây."
              : "Hàng lỗi khi nhập hàng và hàng hoàn bị hỏng sẽ được chuyển vào kho này."}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
