"use client"

import * as React from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, Loader2, Key, Shield, Info } from "lucide-react"

import { useAccountSettings } from "./hooks/use-account-settings"
import { AvatarCropDialog } from "./components/avatar-crop-dialog"
import { ChangePasswordDialog } from "./components/change-password-dialog"

export default function AccountSettings() {
  const {
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
  } = useAccountSettings()

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Cài đặt" },
          { label: "Tài khoản" },
        ]}
        title="Cài đặt tài khoản"
        description="Quản lý thông tin và tùy chọn tài khoản của bạn"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân hiển thị trên hồ sơ và thanh điều hướng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
                <Avatar className="h-24 w-24 rounded-full border-4 border-background shadow-md">
                  <AvatarImage src={profileImage || undefined} alt="Avatar" />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {user?.profile?.firstName?.substring(0, 2).toUpperCase() ||
                      user?.email?.substring(0, 2).toUpperCase() ||
                      "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleFileUploadClick}
                      className="cursor-pointer"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Tải ảnh mới
                    </Button>
                    {profileImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetAvatar}
                        className="cursor-pointer text-destructive hover:bg-destructive/10"
                      >
                        Xóa ảnh
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ định dạng JPG, GIF hoặc PNG. Kích thước tối đa 800KB.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/gif,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <Separator className="my-4" />

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập họ của bạn"
                          {...field}
                          disabled={!isTenantOwner}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên của bạn"
                          {...field}
                          disabled={!isTenantOwner}
                        />
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
                      <FormLabel>Địa chỉ email</FormLabel>
                      <FormControl>
                        {/* Editable by every role: this email is the key used
                            to sign in with Google. */}
                        <Input
                          type="email"
                          placeholder="Nhập địa chỉ email"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Dùng để đăng nhập bằng Google. Email phải trùng với tài
                        khoản Google của bạn.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại (Tên đăng nhập)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Số điện thoại của bạn"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vai trò</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giới tính</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isTenantOwner}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Nam</SelectItem>
                          <SelectItem value="FEMALE">Nữ</SelectItem>
                          <SelectItem value="OTHER">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày sinh</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={!isTenantOwner}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identificationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số CCCD/CMND</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập số CCCD/CMND"
                          {...field}
                          disabled={!isTenantOwner}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã số thuế</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập mã số thuế"
                          {...field}
                          disabled={!isTenantOwner}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập địa chỉ của bạn"
                        {...field}
                        disabled={!isTenantOwner}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Đăng nhập và bảo mật Card - Only visible for Tenant Owner */}
          {isTenantOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Đăng nhập và bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border pt-0">
                {/* Mật khẩu Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex gap-4 items-start">
                    <Key className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Mật khẩu</h4>
                      <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Để bảo mật tài khoản tốt hơn, hãy sử dụng mật khẩu mạnh
                        và thay đổi định kỳ 6 tháng/lần. iKiot sẽ tự động đăng
                        xuất tài khoản khỏi tất cả thiết bị trước khi đổi mật
                        khẩu thành công.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer shrink-0 self-start sm:self-center"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    Đổi mật khẩu
                  </Button>
                </div>

                {/* Xác thực 2 lớp Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 last:pb-0">
                  <div className="flex gap-4 items-start">
                    <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-sm">
                          Xác thực 2 lớp cho tài khoản của bạn
                        </h4>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Yêu cầu mã xác thực khi bạn đăng nhập trên thiết bị lạ.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center self-start sm:self-center">
                    <Switch
                      id="two-factor"
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone Card - Only visible for Tenant Owner */}
          {isTenantOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">
                  Vùng nguy hiểm
                </CardTitle>
                <CardDescription>
                  Các hành động không thể đảo ngược và có tính phá hủy dữ liệu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Xóa tài khoản</h4>
                    <p className="text-sm text-muted-foreground">
                      Xóa vĩnh viễn tài khoản của bạn và toàn bộ dữ liệu đi kèm.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    type="button"
                    className="cursor-pointer"
                  >
                    Xóa tài khoản
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons at the bottom - Always visible */}
          <div className="flex space-x-2 pt-2">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => form.reset()}
              className="cursor-pointer"
              disabled={isSaving}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Form>

      {/* Cropper Modal Dialog */}
      <AvatarCropDialog
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        selectedImageSrc={selectedImageSrc}
        imageState={imageState}
        setImageState={setImageState}
        isDragging={isDragging}
        dimensions={dimensions}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleApplyCrop={handleApplyCrop}
        isUploading={isUploading}
      />

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        userId={user?.id || ""}
      />
    </div>
  )
}
