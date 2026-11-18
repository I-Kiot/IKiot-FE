import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/store/auth-store"
import { canEditAccountProfile } from "@/components/sidebar/constants/role-permissions"
import { updateMe } from "@/lib/api/auth"
import { uploadImage } from "@/lib/api/upload"
import { getUserRoleLabel } from "@/types/role"
import { toast } from "sonner"
import { useImageCrop } from "@/components/image-crop/use-image-crop"
import { accountFormSchema, AccountFormValues } from "../types"

export function useAccountSettings() {
  const { user, fetchMe } = useAuthStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const crop = useImageCrop()

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const isTenantOwner = canEditAccountProfile(user?.role)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      role: "",
      address: "",
      gender: "MALE",
      identificationId: "",
      taxNumber: "",
      dob: "",
    },
  })

  const formatDateToInput = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ""
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    } catch {
      return ""
    }
  }

  useEffect(() => {
    if (user) {
      const translatedRole = getUserRoleLabel(user.role)

      form.reset({
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        email: user.email || "",
        username: user.phoneNumber || "",
        role: translatedRole,
        address: user.profile?.address || "",
        gender: user.profile?.gender || "MALE",
        identificationId: user.profile?.identificationId || "",
        taxNumber: user.profile?.taxNumber || "",
        dob: formatDateToInput(user.profile?.dob),
      })
      if (user.profile?.avatarUrl) {
        setProfileImage(user.profile.avatarUrl)
      }
    }
  }, [user, form])

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 800 * 1024) {
        toast.error("Kích thước tệp tối đa cho phép là 800KB")
        return
      }
      crop.open(file)
    }
  }

  const handleResetAvatar = () => {
    setProfileImage(null)
    setPendingAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleApplyCrop = async () => {
    setIsUploading(true)
    try {
      const blob = await crop.crop()
      const croppedFile = new File([blob], "avatar.png", { type: "image/png" })
      setProfileImage(URL.createObjectURL(blob))
      setPendingAvatarFile(croppedFile)
      toast.success(
        "Đã áp dụng ảnh đại diện (nhấn Lưu thay đổi để lưu chính thức)",
      )
      crop.setIsOpen(false)
    } catch (error) {
      console.error("Crop error:", error)
      toast.error("Có lỗi xảy ra trong quá trình xử lý ảnh")
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(data: AccountFormValues) {
    if (!user) return
    setIsSaving(true)
    try {
      let finalAvatarUrl = user.profile?.avatarUrl || ""

      if (profileImage === null) {
        finalAvatarUrl = ""
      } else if (pendingAvatarFile) {
        const uploadedUrl = await uploadImage(pendingAvatarFile)
        finalAvatarUrl = uploadedUrl
      }

      await updateMe({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: finalAvatarUrl || undefined,
        address: data.address || undefined,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        taxNumber: data.taxNumber || undefined,
        identificationId: data.identificationId || undefined,
      })

      toast.success("Cập nhật thông tin tài khoản thành công!")
      setPendingAvatarFile(null)
      await fetchMe()
    } catch (error: any) {
      console.error("Save account error:", error)
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Cập nhật tài khoản thất bại",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    user,
    form,
    profileImage,
    crop,
    isUploading,
    isSaving,
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    twoFactorEnabled,
    setTwoFactorEnabled,
    isTenantOwner,
    fileInputRef,
    handleFileUploadClick,
    handleFileChange,
    handleResetAvatar,
    handleApplyCrop,
    onSubmit,
  }
}
