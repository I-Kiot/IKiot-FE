"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff, StaffGender, StaffProfilePayload } from "@/types/staff";
import {
  parseIdentificationId,
  validateStaffIdentificationId,
} from "@/app/(protected)/staffs/shared/identification-format";
import {
  normalizeStaffPhoneNumber,
  validateStaffPhoneNumber,
} from "@/app/(protected)/staffs/shared/staff-phone-validation";
import {
  getDobInputBounds,
  getHireDateInputBounds,
  isValidTaxNumber,
  normalizeDateInput,
  parseTaxNumber,
  validateOptionalDob,
  validateOptionalHireDate,
} from "@/app/(protected)/staffs/shared/staff-date-validation";
import { toDateInputValue } from "@/app/(protected)/staffs/shared/staff-format";
import { CccdInput } from "./cccd-input";
import { StaffAvatarField } from "./staff-avatar-field";
import { uploadImage } from "@/lib/api/upload";
import { staffApi } from "@/lib/api/staff";
import { getSessionBranchId, getSessionRole } from "@/lib/auth";
import {
  canAssignWarehouseOnStaffForm,
  canEditStaffRoleAndWorkplace,
  shouldLockBranchOnCreate,
} from "@/components/sidebar/constants/role-permissions";
import {
} from "@/app/(protected)/staffs/shared/staff-workplace";
import { useStaffs } from "./staffs-provider";
import { EmptyOptionsNotice, EmptyOptionsLink } from "@/components/empty-options-notice";

/** Regex email. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tránh Zod union hiện "Invalid input" khi email rỗng / sai định dạng. */
const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || EMAIL_PATTERN.test(value), {
    message: "Email không hợp lệ",
  });

/** Email bắt buộc khi tạo nhân viên: mã OTP đăng nhập lần đầu gửi về đây. */
const requiredEmailSchema = z
  .string()
  .trim()
  .min(1, "Email là bắt buộc")
  .refine((value) => EMAIL_PATTERN.test(value), {
    message: "Email không hợp lệ",
  });

const GENDER_OPTIONS: { value: StaffGender; label: string }[] = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const dobInputBounds = getDobInputBounds();
const hireDateInputBounds = getHireDateInputBounds();

function applyStaffProfileValidation(
  data: {
    dob?: string;
    hireDate?: string;
    taxNumber?: string;
    identificationId?: string;
    gender?: string;
  },
  ctx: z.RefinementCtx,
  opts?: { identificationRequired?: boolean },
) {
  const dobResult = validateOptionalDob(data.dob);
  if (!dobResult.ok) {
    ctx.addIssue({
      code: "custom",
      message: dobResult.message ?? "Ngày sinh không hợp lệ",
      path: ["dob"],
    });
  }

  const hireDateResult = validateOptionalHireDate(data.hireDate, data.dob);
  if (!hireDateResult.ok) {
    ctx.addIssue({
      code: "custom",
      message: hireDateResult.message ?? "Ngày vào làm không hợp lệ",
      path: ["hireDate"],
    });
  }

  if (data.taxNumber?.trim() && !isValidTaxNumber(data.taxNumber)) {
    ctx.addIssue({
      code: "custom",
      message: "Mã số thuế phải có 10–14 chữ số",
      path: ["taxNumber"],
    });
  }

  const cccdError = validateStaffIdentificationId(data.identificationId, {
    required: opts?.identificationRequired ?? false,
    dob: data.dob,
    gender: data.gender,
  });
  if (cccdError) {
    ctx.addIssue({
      code: "custom",
      message: cccdError,
      path: ["identificationId"],
    });
  }
}

const profileFieldsSchema = {
  identificationId: z.string().optional(),
  address: z.string().max(255, "Địa chỉ tối đa 255 ký tự").optional(),
  gender: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        value === "MALE" ||
        value === "FEMALE" ||
        value === "OTHER",
      { message: "Giới tính không hợp lệ" },
    ),
  dob: z.string().optional(),
  taxNumber: z.string().optional(),
};

/** Giá trị Select cho "chưa chọn xưởng" (Radix Select không nhận value rỗng). */
const NO_WORKSHOP = "none";
const workshopIdOf = (value?: string) => (value && value !== NO_WORKSHOP ? value : null);

/** Nhân viên thuộc chi nhánh, kho hoặc xưởng. */
const WORKPLACE_TYPE = {
  BRANCH: "BRANCH",
  WAREHOUSE: "WAREHOUSE",
  WORKSHOP: "WORKSHOP",
} as const;
type WorkplaceType = (typeof WORKPLACE_TYPE)[keyof typeof WORKPLACE_TYPE];

const WORKPLACE_TYPE_LABEL: Record<WorkplaceType, string> = {
  BRANCH: "Chi nhánh",
  WAREHOUSE: "Kho hàng",
  WORKSHOP: "Xưởng",
};

function workplaceTypeOf(staff: Staff): WorkplaceType | "" {
  if (staff.branchId) return WORKPLACE_TYPE.BRANCH;
  if (staff.warehouseId) return WORKPLACE_TYPE.WAREHOUSE;
  if (staff.workshopId) return WORKPLACE_TYPE.WORKSHOP;
  return "";
}

function applyWorkplaceValidation(
  data: {
    workplaceType?: string;
    branchId?: string;
    warehouseId?: string;
    workshopId?: string;
  },
  ctx: z.RefinementCtx,
) {
  switch (data.workplaceType) {
    case WORKPLACE_TYPE.BRANCH:
      if (!data.branchId?.trim())
        ctx.addIssue({ code: "custom", message: "Chọn chi nhánh", path: ["branchId"] });
      return;
    case WORKPLACE_TYPE.WAREHOUSE:
      if (!data.warehouseId?.trim())
        ctx.addIssue({ code: "custom", message: "Chọn kho hàng", path: ["warehouseId"] });
      return;
    case WORKPLACE_TYPE.WORKSHOP:
      if (!workshopIdOf(data.workshopId))
        ctx.addIssue({ code: "custom", message: "Chọn xưởng", path: ["workshopId"] });
      return;
    default:
      ctx.addIssue({
        code: "custom",
        message: "Chọn nhân viên thuộc chi nhánh, kho hay xưởng",
        path: ["workplaceType"],
      });
  }
}

function buildProfilePayload(data: {
  identificationId?: string;
  address?: string;
  gender?: string;
  dob?: string;
  avatarUrl?: string | null;
  taxNumber?: string;
}): StaffProfilePayload | undefined {
  const profile: StaffProfilePayload = {
    identificationId: parseIdentificationId(data.identificationId) || undefined,
    address: data.address?.trim() || undefined,
    gender: (data.gender as StaffGender) || undefined,
    dob: normalizeDateInput(data.dob),
    avatarUrl:
      data.avatarUrl === null
        ? ""
        : data.avatarUrl?.trim() || undefined,
    taxNumber: parseTaxNumber(data.taxNumber) || undefined,
  };

  const hasExplicitAvatar =
    data.avatarUrl === null || Boolean(data.avatarUrl?.trim());
  const hasOtherValue = Object.entries(profile)
    .filter(([key]) => key !== "avatarUrl")
    .some(([, value]) => Boolean(value));

  return hasExplicitAvatar || hasOtherValue ? profile : undefined;
}

const createFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Tên là bắt buộc").max(50, "Tên tối đa 50 ký tự"),
    lastName: z.string().trim().min(1, "Họ là bắt buộc").max(50, "Họ tối đa 50 ký tự"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Số điện thoại là bắt buộc")
      .superRefine((value, ctx) => {
        const error = validateStaffPhoneNumber(value);
        if (error) {
          ctx.addIssue({ code: "custom", message: error });
        }
      }),
    email: requiredEmailSchema,
    roleId: z.string().min(1, "Vai trò là bắt buộc"),
    workplaceType: z.string().optional(),
    branchId: z.string().optional(),
    warehouseId: z.string().optional(),
    workshopId: z.string().optional(),
    hireDate: z.string().optional(),
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    reEnterPassword: z.string().min(6, "Xác nhận mật khẩu tối thiểu 6 ký tự"),
    ...profileFieldsSchema,
  })
  .refine((data) => data.newPassword === data.reEnterPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["reEnterPassword"],
  })
  .superRefine((data, ctx) => {
    applyStaffProfileValidation(data, ctx, { identificationRequired: true });
    applyWorkplaceValidation(data, ctx);
  });

const editFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Tên là bắt buộc").max(50, "Tên tối đa 50 ký tự"),
    lastName: z.string().trim().min(1, "Họ là bắt buộc").max(50, "Họ tối đa 50 ký tự"),
    email: optionalEmailSchema,
    roleId: z.string().min(1, "Vai trò là bắt buộc"),
    workplaceType: z.string().optional(),
    branchId: z.string().optional(),
    warehouseId: z.string().optional(),
    workshopId: z.string().optional(),
    hireDate: z.string().optional(),
    accountNote: z.string().optional(),
    ...profileFieldsSchema,
  })
  .superRefine((data, ctx) => {
    applyStaffProfileValidation(data, ctx, { identificationRequired: false });
    applyWorkplaceValidation(data, ctx);
  });

type CreateFormValues = z.infer<typeof createFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

function getEditDefaults(staff: Staff): EditFormValues {
  return {
    firstName: staff.firstName ?? "",
    lastName: staff.lastName ?? "",
    email: staff.email ?? "",
    roleId: staff.roleId ?? "",
    workplaceType: workplaceTypeOf(staff),
    branchId: staff.branchId ?? "",
    warehouseId: staff.warehouseId ?? "",
    workshopId: staff.workshopId ?? NO_WORKSHOP,
    hireDate: toDateInputValue(staff.joinedAt),
    identificationId:
      parseIdentificationId(staff.profile?.identificationId) ?? "",
    address: staff.profile?.address ?? "",
    gender: staff.profile?.gender ?? "",
    dob: toDateInputValue(staff.profile?.dob),
    taxNumber: staff.profile?.taxNumber ?? "",
    accountNote: staff.accountNote ?? "",
  };
}

const EMPTY_CREATE_VALUES: CreateFormValues = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
  roleId: "",
  workplaceType: "",
  branchId: "",
  warehouseId: "",
  workshopId: NO_WORKSHOP,
  hireDate: "",
  identificationId: "",
  address: "",
  gender: "",
  dob: "",
  taxNumber: "",
  newPassword: "",
  reEnterPassword: "",
};

type StaffsMutateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Staff;
};

export function StaffsMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: StaffsMutateDialogProps) {
  const isEdit = !!currentRow;
  const userRole = getSessionRole();
  const lockBranchOnCreate = shouldLockBranchOnCreate(getSessionBranchId());
  const canAssignWarehouse = canAssignWarehouseOnStaffForm(userRole);
  // Quyền đặt role và nơi làm việc.
  const canEditRoleWorkplace = canEditStaffRoleAndWorkplace(userRole, isEdit);

  const {
    handleAdd,
    handleEdit,
    roleOptions,
    branchOptions,
    warehouseOptions,
    warehouseOptionsFailed,
    workshopOptions,
    reloadWorkplaceOptions,
  } = useStaffs();

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const avatarBlobUrlRef = useRef<string | null>(null);

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: EMPTY_CREATE_VALUES,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");
  const avatarFullName = `${watchedLastName} ${watchedFirstName}`.trim();

  // Mọi chi nhánh / kho đều chọn được.
  const visibleBranchOptions = branchOptions;
  const visibleWarehouseOptions = warehouseOptions;

  const watchedWorkplaceType = form.watch("workplaceType");
  // Loại nơi làm việc hiện được.
  const availableWorkplaceTypes: WorkplaceType[] = [
    WORKPLACE_TYPE.BRANCH,
    ...(canAssignWarehouse || watchedWorkplaceType === WORKPLACE_TYPE.WAREHOUSE
      ? [WORKPLACE_TYPE.WAREHOUSE]
      : []),
    WORKPLACE_TYPE.WORKSHOP,
  ];

  function clearAvatarBlobUrl() {
    if (avatarBlobUrlRef.current) {
      URL.revokeObjectURL(avatarBlobUrlRef.current);
      avatarBlobUrlRef.current = null;
    }
  }

  function resetAvatarDraft(existingUrl?: string) {
    clearAvatarBlobUrl();
    setPendingAvatarFile(null);
    setAvatarRemoved(false);
    setAvatarPreviewUrl(existingUrl ?? null);
  }

  function handleSelectAvatarFile(file: File) {
    clearAvatarBlobUrl();
    const objectUrl = URL.createObjectURL(file);
    avatarBlobUrlRef.current = objectUrl;
    setPendingAvatarFile(file);
    setAvatarPreviewUrl(objectUrl);
    setAvatarRemoved(false);
  }

  function handleRemoveAvatar() {
    clearAvatarBlobUrl();
    setPendingAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarRemoved(true);
  }

  function resolveAvatarUrl(existingUrl?: string): string | null | undefined {
    if (avatarRemoved) return null;
    return existingUrl?.trim() || undefined;
  }

  useEffect(() => {
    return () => clearAvatarBlobUrl();
  }, []);



  // Tải lại nơi làm việc mỗi lần mở form.
  useEffect(() => {
    if (open) reloadWorkplaceOptions();
  }, [open, reloadWorkplaceOptions]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && currentRow) {
      resetAvatarDraft(currentRow.profile?.avatarUrl);
      form.reset(getEditDefaults(currentRow));
    } else {
      resetAvatarDraft();
      const defaultBranchId =
        lockBranchOnCreate && getSessionBranchId()
          ? getSessionBranchId()!
          : "";
      form.reset({
        ...EMPTY_CREATE_VALUES,
        workplaceType: defaultBranchId ? WORKPLACE_TYPE.BRANCH : "",
        branchId: defaultBranchId,
        warehouseId: "",
      });
    }
  }, [open, isEdit, currentRow, form, lockBranchOnCreate]);


  /** Chỉ gửi nơi làm việc của loại đã chọn. */
  function workplacePayload(
    values: CreateFormValues | EditFormValues,
    editing: boolean,
  ) {
    const type = values.workplaceType;
    return {
      branchId: type === WORKPLACE_TYPE.BRANCH ? values.branchId || null : null,
      warehouseId:
        type === WORKPLACE_TYPE.WAREHOUSE ? values.warehouseId || null : null,
      workshopId:
        type === WORKPLACE_TYPE.WORKSHOP ? workshopIdOf(values.workshopId) : null,
      ...(editing && type === WORKPLACE_TYPE.WORKSHOP
        ? { clearLocation: true }
        : {}),
    };
  }

  async function onSubmit(data: CreateFormValues | EditFormValues) {
    const existingAvatarUrl = isEdit ? currentRow?.profile?.avatarUrl : undefined;

    let avatarUrl: string | null | undefined;

    if (pendingAvatarFile) {
      try {
        avatarUrl = await uploadImage(pendingAvatarFile);
      } catch {
        toast.warning("Không tải được ảnh đại diện. Nhân viên vẫn được lưu.");
        avatarUrl = isEdit ? existingAvatarUrl : undefined;
      }
    } else {
      avatarUrl = resolveAvatarUrl(existingAvatarUrl);
    }

    try {
      if (isEdit && currentRow) {
        const editData = data as EditFormValues;
        const profilePayload: Parameters<typeof handleEdit>[1] = {
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email || undefined,
          hireDate: normalizeDateInput(editData.hireDate),
          profile: buildProfilePayload({
            ...editData,
            avatarUrl,
          }),
          accountNote: editData.accountNote?.trim() || "",
        };

        // Bổ nhiệm quản lý làm ở màn chi nhánh / kho.
        if (canEditRoleWorkplace) {
          profilePayload.roleId = editData.roleId;
          Object.assign(profilePayload, workplacePayload(editData, true));
        }

        await handleEdit(currentRow.id, profilePayload);
      } else {
        const createData = data as CreateFormValues;
        await handleAdd({
          firstName: createData.firstName,
          lastName: createData.lastName,
          phoneNumber: normalizeStaffPhoneNumber(createData.phoneNumber),
          email: createData.email,
          roleId: createData.roleId,
          ...workplacePayload(createData, false),
          hireDate: normalizeDateInput(createData.hireDate),
          profile: buildProfilePayload({
            ...createData,
            avatarUrl: avatarUrl ?? undefined,
          }),
          newPassword: createData.newPassword,
          reEnterPassword: createData.reEnterPassword,
        });
      }
      onOpenChange(false);
    } catch {
      // Provider đã toast lỗi.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Ảnh đại diện</FormLabel>
              <StaffAvatarField
                previewUrl={avatarPreviewUrl ?? undefined}
                hasPendingFile={!!pendingAvatarFile}
                onSelectFile={handleSelectAvatarFile}
                onRemove={handleRemoveAvatar}
                fullName={avatarFullName}
              />
            </FormItem>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn" {...field} />
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
                      <Input placeholder="An" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEdit && currentRow && (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <Input value={currentRow.phoneNumber} disabled readOnly />
              </FormItem>
            )}

            {!isEdit && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số điện thoại <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0901234567"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={field.value}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) =>
                          field.onChange(
                            normalizeStaffPhoneNumber(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email{" "}
                    {!isEdit && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="name@ikiot.vn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vai trò <span className="text-destructive">*</span>
                    </FormLabel>
                    {roleOptions.length === 0 ? (
                      // Dropdown role rỗng thì chỉ chỗ tạo role.
                      <EmptyOptionsNotice>
                        Cửa hàng chưa có vai trò nào. Hãy tạo vai trò ở{' '}
                        <EmptyOptionsLink href="/staffs/roles">
                          Nhân viên › Phân quyền
                        </EmptyOptionsLink>{' '}
                        trước khi thêm nhân viên.
                      </EmptyOptionsNotice>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!canEditRoleWorkplace}
                      >
                        <FormControl>
                          <SelectTrigger className="cursor-pointer w-full">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workplaceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Thuộc về <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Đổi loại thì bỏ lựa chọn của loại cũ: nhân viên chỉ thuộc một nơi.
                        form.setValue("branchId", "");
                        form.setValue("warehouseId", "");
                        form.setValue("workshopId", NO_WORKSHOP);
                      }}
                      value={field.value || ""}
                      disabled={
                        !canEditRoleWorkplace || (lockBranchOnCreate && !isEdit)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chi nhánh, kho hay xưởng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableWorkplaceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {WORKPLACE_TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedWorkplaceType === WORKPLACE_TYPE.BRANCH && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Chi nhánh <span className="text-destructive">*</span>
                      </FormLabel>
                      {visibleBranchOptions.length > 0 ? (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={
                            !canEditRoleWorkplace ||
                            (lockBranchOnCreate && !isEdit)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="cursor-pointer w-full">
                              <SelectValue placeholder="Chọn chi nhánh" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {visibleBranchOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                          Hiện chưa có chi nhánh nào trong hệ thống.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedWorkplaceType === WORKPLACE_TYPE.WAREHOUSE && (
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kho hàng <span className="text-destructive">*</span>
                      </FormLabel>
                      {visibleWarehouseOptions.length > 0 ? (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!canEditRoleWorkplace}
                        >
                          <FormControl>
                            <SelectTrigger className="cursor-pointer w-full">
                              <SelectValue placeholder="Chọn kho hàng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {visibleWarehouseOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                          {warehouseOptionsFailed
                            ? "Không tải được danh sách kho."
                            : "Hiện chưa có kho hàng nào trong hệ thống."}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedWorkplaceType === WORKPLACE_TYPE.WORKSHOP && (
                <FormField
                  control={form.control}
                  name="workshopId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Xưởng <span className="text-destructive">*</span>
                      </FormLabel>
                      {workshopOptions.length > 0 || currentRow?.workshopId ? (
                        <Select
                          onValueChange={field.onChange}
                          value={
                            field.value && field.value !== NO_WORKSHOP
                              ? field.value
                              : ""
                          }
                          disabled={!canEditRoleWorkplace}
                        >
                          <FormControl>
                            <SelectTrigger className="cursor-pointer w-full">
                              <SelectValue placeholder="Chọn xưởng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workshopOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                            {/* Xưởng hiện tại không còn trong danh sách (không xem được NCC) vẫn phải hiện tên. */}
                            {currentRow?.workshopId &&
                              !workshopOptions.some(
                                (o) => o.value === currentRow.workshopId,
                              ) && (
                                <SelectItem value={currentRow.workshopId}>
                                  {currentRow.workshopName ?? "Xưởng hiện tại"}
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                          Hiện chưa có xưởng nào (nhà cung cấp loại Xưởng).
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Nhân viên xưởng xem yêu cầu sản xuất của xưởng ở mọi kho và tạo phiếu giao. Quyền này
                        tự có khi gắn xưởng, không cần cấp trong vai trò.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày vào làm</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={hireDateInputBounds.min}
                      max={hireDateInputBounds.max}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="identificationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      CCCD{" "}
                      {!isEdit ? (
                        <span className="text-destructive">*</span>
                      ) : null}
                    </FormLabel>
                    <FormControl>
                      <CccdInput
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
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
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Input placeholder="Ho Chi Minh City" {...field} />
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
                      placeholder="0123456789"
                      inputMode="numeric"
                      {...field}
                      onChange={(event) =>
                        field.onChange(parseTaxNumber(event.target.value))
                      }
                    />
                  </FormControl>
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
                      min={dobInputBounds.min}
                      max={dobInputBounds.max}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <div className="grid grid-cols-2 items-start gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="gap-2">
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <div className="min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reEnterPassword"
                  render={({ field }) => (
                    <FormItem className="gap-2">
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <div className="min-h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {isEdit && (
              <FormField
                control={form.control}
                name="accountNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú tài khoản</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ghi chú nội bộ về tài khoản nhân viên..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {isEdit ? (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Lưu thay đổi
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Thêm nhân viên
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
