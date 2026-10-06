"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SWITCHER_STATUS_OPTIONS } from "./constants/status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  DamagedLocationField,
  type DamagedLocationOption,
} from "./damaged-location-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Mirrors branchFormSchema: `CreateWarehouseDto` gained `phoneNumber` and `email` in the
// 2026-08-19 migration that gave warehouses the same contact details a branch has, and
// `phoneNumber` is **required** there (`@ArrayNotEmpty`). This form never collected it, so
// every "thêm kho hàng" was a 400 the moment the field existed server-side.
const warehouseFormSchema = z.object({
  name: z.string().min(1, {
    message: "Tên kho hàng là bắt buộc.",
  }),
  status: z.string().min(1, {
    message: "Trạng thái là bắt buộc.",
  }),
  address: z.string(),
  phoneNumber: z
    .string()
    .trim()
    .min(1, { message: "Số điện thoại là bắt buộc." })
    .regex(/^0\d{9}$/, { message: "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0." }),
  email: z
    .string()
    .email({ message: "Email không hợp lệ." })
    .optional()
    .or(z.literal("")),
  isSellable: z.boolean(),
  damagedLocationId: z.string(),
})

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: WarehouseFormValues) => void
  defaultValues?: Partial<WarehouseFormValues>
  title?: string
  /** Non-sellable warehouses to pick a default damaged-goods warehouse from. */
  damagedWarehouses?: DamagedLocationOption[]
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
  damagedWarehouses = [],
}: WarehouseFormDialogProps) {
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      status: "ACTIVE",
      address: "",
      phoneNumber: "",
      email: "",
      isSellable: true,
      damagedLocationId: "",
      ...defaultValues,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        status: "ACTIVE",
        address: "",
        phoneNumber: "",
        email: "",
        isSellable: true,
        damagedLocationId: "",
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  function handleFormSubmit(data: WarehouseFormValues) {
    onSubmit(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Thêm kho hàng mới"}</DialogTitle>
          <DialogDescription>
            Nhập các thông tin chi tiết để tạo một kho hàng mới. Nhấp Lưu khi bạn hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên kho hàng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên kho hàng (ví dụ: Kho trung tâm)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SWITCHER_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ kho hàng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số điện thoại (ví dụ: 0987654321)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Nhập địa chỉ email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isSellable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-3 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Kho hàng hỏng</FormLabel>
                    <FormDescription>
                      Bật nếu kho này chỉ chứa hàng lỗi / hàng hoàn bị hỏng. Hàng trong kho không được bán.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!field.value}
                      onCheckedChange={(damaged) => field.onChange(!damaged)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DamagedLocationField
              control={form.control}
              name="damagedLocationId"
              options={damagedWarehouses}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" className="cursor-pointer">
                Lưu kho hàng
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
