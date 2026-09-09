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
import type { PaySheetOption } from "@/types/paysheet";
import { paySheetApi } from "@/lib/api/paysheet";
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
  validateStaffWorkplace,
} from "@/app/(protected)/staffs/shared/staff-workplace";
import { useStaffs } from "./staffs-provider";
import { EmptyOptionsNotice, EmptyOptionsLink } from "@/components/empty-options-notice";

/** Tránh Zod union hiện "Invalid input" khi email rỗng / sai định dạng. */
const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    { message: "Email không hợp lệ" },
  );

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

function applyWorkplaceValidation(
  data: { branchId?: string; warehouseId?: string },
  ctx: z.RefinementCtx,
) {
  // One rule for everybody now. The old backend had a per-role version of this - a
  // BRANCH_MANAGER had to have a branch, a WAREHOUSE_MANAGER a warehouse - and those roles
  // no longer exist; what survives is "exactly one workplace", which the backend enforces
  // for every account.
  const workplaceError = validateStaffWorkplace(
    data.branchId,
    data.warehouseId,
  );
  if (workplaceError) {
    ctx.addIssue({
      code: "custom",
      message: workplaceError,
      path: ["branchId"],
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

const PAYSHEET_NONE = "__none__";

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
    email: optionalEmailSchema,
    roleId: z.string().min(1, "Vai trò là bắt buộc"),
    branchId: z.string().optional(),
    warehouseId: z.string().optional(),
    hireDate: z.string().optional(),
    paySheetId: z.string().optional(),
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
    branchId: z.string().optional(),
    warehouseId: z.string().optional(),
    hireDate: z.string().optional(),
    paySheetId: z.string().optional(),
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
    branchId: staff.branchId ?? "",
    warehouseId: staff.warehouseId ?? "",
    hireDate: toDateInputValue(staff.joinedAt),
    paySheetId: staff.paySheetId || PAYSHEET_NONE,
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
  branchId: "",
  warehouseId: "",
  hireDate: "",
  paySheetId: PAYSHEET_NONE,
  identificationId: "",
  address: "",
  gender: "",
  dob: "",
  taxNumber: "",
  newPassword: "",
  reEnterPassword: "",
};

function resolvePaySheetIdForApi(value?: string): string | null {
  if (!value || value === PAYSHEET_NONE) return null;
  return value;
}

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
  // "Promoting to manager" was a role change. Running a location is an appointment now
  // (`PATCH /branches/:id/manager`), so what is left here is simply whether this account
  // may set somebody's role and workplace - which is `users:create` while hiring and
  // `users:update` while editing, exactly as the two backend routes are gated.
  const canEditRoleWorkplace = canEditStaffRoleAndWorkplace(userRole, isEdit);

  const { handleAdd, handleEdit, roleOptions, branchOptions, warehouseOptions, warehouseOptionsFailed } =
    useStaffs();

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [paySheetOptions, setPaySheetOptions] = useState<PaySheetOption[]>([]);
  const [paySheetOptionsFailed, setPaySheetOptionsFailed] = useState(false);
  /** Chi nhánh / kho đã có quản lý ACTIVE - ẩn khi tạo/gán BM/WM. */
  const [occupiedBranchIds, setOccupiedBranchIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [occupiedWarehouseIds, setOccupiedWarehouseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const avatarBlobUrlRef = useRef<string | null>(null);

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: EMPTY_CREATE_VALUES,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const selectedBranchId = form.watch("branchId");
  const selectedWarehouseId = form.watch("warehouseId");
  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");
  const avatarFullName = `${watchedLastName} ${watchedFirstName}`.trim();

  const visibleBranchOptions = useMemo(() => {
    return branchOptions.filter((option) => {
      if (isEdit && currentRow?.branchId === option.value) return true;
      return !occupiedBranchIds.has(option.value);
    });
  }, [
    branchOptions,
    occupiedBranchIds,
    isEdit,
    currentRow?.branchId,
  ]);

  const visibleWarehouseOptions = useMemo(() => {
    return warehouseOptions.filter((option) => {
      if (isEdit && currentRow?.warehouseId === option.value) return true;
      return !occupiedWarehouseIds.has(option.value);
    });
  }, [
    warehouseOptions,
    occupiedWarehouseIds,
    isEdit,
    currentRow?.warehouseId,
  ]);

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

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    void Promise.all([
      // Which locations already have somebody running them. There is no manager *role*
      // to filter on any more, so this reads every active account and the caller matches
      // them against Branch.managerId / Warehouse.managerId.
      staffApi.getList({ status: "ACTIVE", page: 1, limit: 100 }),
      staffApi.getList({ status: "ACTIVE", page: 1, limit: 100 }),
    ])
      .then(([branchManagers, warehouseManagers]) => {
        if (cancelled) return;
        setOccupiedBranchIds(
          new Set(
            (branchManagers.data ?? [])
              .map((staff) => staff.branchId)
              .filter((id): id is string => Boolean(id)),
          ),
        );
        setOccupiedWarehouseIds(
          new Set(
            (warehouseManagers.data ?? [])
              .map((staff) => staff.warehouseId)
              .filter((id): id is string => Boolean(id)),
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOccupiedBranchIds(new Set());
        setOccupiedWarehouseIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void paySheetApi
      .getAllForOptions()
      .then((options) => {
        if (cancelled) return;
        // Giữ option hiện tại nếu nhân viên đang gán bảng lương không còn trong list.
        if (
          isEdit &&
          currentRow?.paySheetId &&
          !options.some((item) => item.value === currentRow.paySheetId)
        ) {
          options = [
            {
              value: currentRow.paySheetId,
              label:
                currentRow.paySheetName ||
                `Bảng lương đã gán (#${currentRow.paySheetId.slice(-6)})`,
            },
            ...options,
          ];
        }
        setPaySheetOptions(options);
        setPaySheetOptionsFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPaySheetOptions([]);
        setPaySheetOptionsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, currentRow?.paySheetId, currentRow?.paySheetName]);

  // Bỏ chọn CN/kho đã có quản lý (trừ chính NV đang sửa).
  useEffect(() => {
    if (!open) return;
    if (selectedBranchId) {
      const stillVisible = visibleBranchOptions.some(
        (option) => option.value === selectedBranchId,
      );
      if (!stillVisible) {
        form.setValue("branchId", "");
      }
    }
    if (selectedWarehouseId) {
      const stillVisible = visibleWarehouseOptions.some(
        (option) => option.value === selectedWarehouseId,
      );
      if (!stillVisible) {
        form.setValue("warehouseId", "");
      }
    }
  }, [
    open,
    selectedBranchId,
    selectedWarehouseId,
    visibleBranchOptions,
    visibleWarehouseOptions,
    form,
  ]);

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
        branchId: defaultBranchId,
        warehouseId: "",
      });
    }
  }, [open, isEdit, currentRow, form, lockBranchOnCreate]);

  useEffect(() => {
    if (!open || isEdit || canAssignWarehouse) return;
    form.setValue("warehouseId", "");
  }, [open, isEdit, canAssignWarehouse, form]);

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
          paySheetId: resolvePaySheetIdForApi(editData.paySheetId),
          profile: buildProfilePayload({
            ...editData,
            avatarUrl,
          }),
          accountNote: editData.accountNote?.trim() || "",
        };

        // The "promote to manager" branches lived here, each one editing the person and
        // then calling assignManager in the same submit. Promotion is not a thing a staff
        // form does any more: the role is just another field, and appointing somebody to
        // run a location is its own action (`PATCH /branches/:id/manager`), reachable from
        // the branch and warehouse screens.
        if (canEditRoleWorkplace) {
          profilePayload.roleId = editData.roleId;
          profilePayload.branchId = editData.branchId || null;
          profilePayload.warehouseId = canAssignWarehouse
            ? editData.warehouseId || null
            : undefined;
        }

        await handleEdit(currentRow.id, profilePayload);
      } else {
        const createData = data as CreateFormValues;
        await handleAdd({
          firstName: createData.firstName,
          lastName: createData.lastName,
          phoneNumber: normalizeStaffPhoneNumber(createData.phoneNumber),
          email: createData.email || undefined,
          roleId: createData.roleId,
          branchId: createData.branchId || null,
          warehouseId: canAssignWarehouse
            ? createData.warehouseId || null
            : undefined,
          hireDate: normalizeDateInput(createData.hireDate),
          paySheetId: resolvePaySheetIdForApi(createData.paySheetId),
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
      // Error toast handled in provider / above
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
                  <FormLabel>Email</FormLabel>
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
                      // `POST /users` bắt buộc roleId, nên một dropdown rỗng ở đây là ngõ
                      // cụt: form không gửi được và không nói vì sao. Chỉ đúng chỗ cần đi.
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
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Chi nhánh{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      {visibleBranchOptions.length > 0 ? (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("warehouseId", "");
                          }}
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
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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

              {canAssignWarehouse && (
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("branchId", "");
                          }}
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
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                          {warehouseOptionsFailed
                            ? "Không tải được danh sách kho."
                            : warehouseOptions.length > 0
                              ? "Tất cả kho đã có quản lý."
                              : "Hiện chưa có kho hàng nào trong hệ thống."}
                        </p>
                      )}
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

            <FormField
              control={form.control}
              name="paySheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bảng lương</FormLabel>
                  {paySheetOptionsFailed ? (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
                      Không tải được danh sách bảng lương (
                      <code className="text-xs">GET /payroll/paysheets</code>
                      ).
                    </p>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || PAYSHEET_NONE}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder="Chọn bảng lương" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PAYSHEET_NONE}>
                          Chưa gán bảng lương
                        </SelectItem>
                        {paySheetOptions.map((option) => (
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
