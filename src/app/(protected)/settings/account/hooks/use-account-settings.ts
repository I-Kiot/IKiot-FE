import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/store/auth-store"
import { canEditAccountProfile } from "@/components/sidebar/constants/role-permissions"
import { updateMe } from "@/lib/api/auth"
import { uploadImage } from "@/lib/api/upload"
import { getUserRoleLabel } from "@/types/role"
import { toast } from "sonner"
import { accountFormSchema, AccountFormValues } from "../types"

export function useAccountSettings() {
  const { user, fetchMe } = useAuthStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [imageState, setImageState] = useState({
    x: 0,
    y: 0,
    zoom: 1,
    rotate: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ w: 256, h: 256 })

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

  // Load user profile details
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
      const reader = new FileReader()
      reader.onload = (event) => {
        const resultSrc = event.target?.result as string

        const img = new Image()
        img.onload = () => {
          const W = 256
          const imgAspect = img.width / img.height
          let renderW = W
          let renderH = W
          if (imgAspect > 1) {
            renderH = W
            renderW = W * imgAspect
          } else {
            renderW = W
            renderH = W / imgAspect
          }
          setDimensions({ w: renderW, h: renderH })
          setSelectedImageSrc(resultSrc)
          setImageState({ x: 0, y: 0, zoom: 1, rotate: 0 })
          setIsCropDialogOpen(true)
        }
        img.src = resultSrc
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResetAvatar = () => {
    setProfileImage(null)
    setPendingAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Mouse drag crop handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - imageState.x, y: e.clientY - imageState.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setImageState((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch crop handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - imageState.x,
      y: e.touches[0].clientY - imageState.y,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    setImageState((prev) => ({
      ...prev,
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    }))
  }

  const handleApplyCrop = async () => {
    if (!selectedImageSrc) return
    setIsUploading(true)
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = selectedImageSrc
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const W = 256
      const S = 512 // 512x512 canvas for high-quality
      const canvas = document.createElement("canvas")
      canvas.width = S
      canvas.height = S
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not create canvas context")

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, S, S)

      const K = S / W

      ctx.translate(S / 2, S / 2)
      ctx.translate(imageState.x * K, imageState.y * K)
      ctx.rotate((imageState.rotate * Math.PI) / 180)
      ctx.scale(imageState.zoom * K, imageState.zoom * K)

      ctx.drawImage(
        img,
        -dimensions.w / 2,
        -dimensions.h / 2,
        dimensions.w,
        dimensions.h,
      )

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Không thể tạo tệp ảnh cắt")
          setIsUploading(false)
          return
        }

        const croppedFile = new File([blob], "avatar.png", {
          type: "image/png",
        })
        const localUrl = URL.createObjectURL(blob)
        setProfileImage(localUrl)
        setPendingAvatarFile(croppedFile)
        toast.success(
          "Đã áp dụng ảnh đại diện (nhấn Lưu thay đổi để lưu chính thức)",
        )
        setIsCropDialogOpen(false)
        setIsUploading(false)
      }, "image/png")
    } catch (error) {
      console.error("Crop error:", error)
      toast.error("Có lỗi xảy ra trong quá trình xử lý ảnh")
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
    selectedImageSrc,
    isCropDialogOpen,
    setIsCropDialogOpen,
    imageState,
    setImageState,
    isDragging,
    dimensions,
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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleApplyCrop,
    onSubmit,
  }
}
