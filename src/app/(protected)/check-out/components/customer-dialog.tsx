"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { customerApi } from "@/lib/api/customer";

const customerSchema = z.object({
  name: z.string().min(2, { message: "Tên khách hàng phải có ít nhất 2 ký tự." }),
  phone: z.string().regex(/^[0-9+]{9,15}$/, {
    message: "Số điện thoại hợp lệ phải từ 9 đến 15 chữ số.",
  }),
  address: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: {
    id: string;
    customerCode: string;
    name: string;
    phone: string;
    address: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  }) => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  onCustomerAdded,
}: CustomerDialogProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      gender: "MALE",
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      // 1. Call POST /customers to create the customer
      const createdCustomer = await customerApi.create({
        name: data.name,
        phone: data.phone,
        address: data.address || "",
        gender: data.gender,
      });

      // 2. Call GET /customers/:id to retrieve the details (as requested by user flow)
      const fetchedCustomer = await customerApi.getById(createdCustomer.id);

      onCustomerAdded(fetchedCustomer);
      toast.success(`Đã thêm thành công khách hàng ${data.name}`);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Lỗi khi thêm khách hàng:", error);
      const msg = error?.response?.data?.message || error?.message || "Thêm khách hàng thất bại";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Thêm Khách Hàng Mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết của khách hàng để lưu vào cơ sở dữ liệu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Họ và tên *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Số điện thoại *</FormLabel>
                  <FormControl>
                    <Input placeholder="090xxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Đường ABC, Quận X, TP. HCM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-semibold text-foreground">Giới tính</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-6"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="MALE" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Nam</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="FEMALE" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Nữ</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="OTHER" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Khác</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
              >
                {form.formState.isSubmitting ? "Đang lưu..." : "Lưu khách hàng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
