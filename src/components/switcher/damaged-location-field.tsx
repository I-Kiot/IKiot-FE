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

/** Radix Select cannot hold an empty value, so "no damaged-goods warehouse" gets this sentinel. */
export const NO_DAMAGED_LOCATION = "__none__"

export interface DamagedLocationOption {
  id: string
  name: string
}

interface DamagedLocationFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  /** Non-sellable warehouses the owner can pick from (the location itself already left out). */
  options: DamagedLocationOption[]
}

/** D-4: where this location's damaged / defective goods go (`damagedLocationId`). */
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
