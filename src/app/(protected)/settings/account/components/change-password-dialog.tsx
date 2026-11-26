"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/password-input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { changePassword } from "@/lib/api/auth"
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới")
      return
    }

    if (form.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    setIsSaving(true)
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        reEnterPassword: form.confirmPassword,
      })

      toast.success("Đổi mật khẩu thành công! Hệ thống sẽ tự động đăng xuất...")
      onOpenChange(false)
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })

      setTimeout(async () => {
        await logout()
        router.replace("/sign-in")
      }, 1500)
    } catch (error) {
      console.error("Change password error:", error)
      const body = getApiErrorBody(error)
      toast.error(messageForCode(body?.code) || body?.message || "Đổi mật khẩu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu mới bên dưới. Sau khi đổi thành công, bạn sẽ được tự động đăng xuất để bảo mật.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              placeholder="Nhập mật khẩu hiện tại"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Xác nhận lại mật khẩu mới"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <DialogFooter className="pt-4 flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
