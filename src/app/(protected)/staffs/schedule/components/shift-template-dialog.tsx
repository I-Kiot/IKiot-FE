"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Clock, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import type { ShiftTemplate } from "@/types/working-schedule";
import { cn } from "@/lib/utils";
import { useSchedule } from "./schedule-provider";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function getShiftDurationHours(startTime: string, endTime: string): number {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) return 0;
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Ca qua đêm
  }
  return Number(((endMinutes - startMinutes) / 60).toFixed(1));
}

const shiftTemplateSchema = z.object({
  name: z.string().trim().min(1, "Tên ca mẫu là bắt buộc"),
  startTime: z
    .string()
    .regex(TIME_PATTERN, "Giờ bắt đầu phải có định dạng HH:mm"),
  endTime: z
    .string()
    .regex(TIME_PATTERN, "Giờ kết thúc phải có định dạng HH:mm"),
});

type ShiftTemplateFormValues = z.infer<typeof shiftTemplateSchema>;

const EMPTY_FORM: ShiftTemplateFormValues = {
  name: "",
  startTime: "08:00",
  endTime: "17:00",
};

const FORM_ID = "shift-template-form";
const LIST_PAGE_SIZE = 8;

export function ShiftTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const {
    shiftTemplates,
    handleCreateShiftTemplate,
    handleUpdateShiftTemplate,
    handleDeleteShiftTemplate,
  } = useSchedule();

  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(
    null,
  );
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(0);

  const form = useForm<ShiftTemplateFormValues>({
    resolver: zodResolver(shiftTemplateSchema),
    defaultValues: EMPTY_FORM,
  });

  const filteredTemplates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return shiftTemplates;
    return shiftTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.startTime.includes(needle) ||
        t.endTime.includes(needle),
    );
  }, [shiftTemplates, search]);

  const totalListPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / LIST_PAGE_SIZE),
  );
  const activePage = Math.min(listPage, totalListPages - 1);

  const pagedTemplates = useMemo(() => {
    const start = activePage * LIST_PAGE_SIZE;
    return filteredTemplates.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredTemplates, activePage]);

  const isSubmitting = form.formState.isSubmitting;
  const isEditing = editingTemplate !== null;
  const targetTemplate = editingTemplate ?? selectedTemplate;

  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setEditingTemplate(null);
      setSearch("");
      setListPage(0);
      form.reset(EMPTY_FORM);
    }
  }, [open, form]);

  useEffect(() => {
    setListPage(0);
  }, [search]);

  function enterEditMode(template: ShiftTemplate) {
    setSelectedTemplate(template);
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
    });
  }

  function selectTemplate(template: ShiftTemplate) {
    if (isEditing) return;
    setSelectedTemplate((prev) =>
      prev?.id === template.id ? null : template,
    );
  }

  const startTimeValue = useWatch({ control: form.control, name: "startTime" });
  const endTimeValue = useWatch({ control: form.control, name: "endTime" });
  const shiftDuration = getShiftDurationHours(startTimeValue || "", endTimeValue || "");

  function beginEdit() {
    if (!selectedTemplate) return;
    enterEditMode(selectedTemplate);
  }

  function cancelEdit() {
    setEditingTemplate(null);
    form.reset(EMPTY_FORM);
  }

  async function onSubmit(values: ShiftTemplateFormValues) {
    const duration = getShiftDurationHours(values.startTime, values.endTime);
    if (duration > 8) {
      toast.warning(
        `Cảnh báo: Ca làm việc "${values.name}" có thời lượng (${duration} tiếng) vượt quá 8 tiếng, nhưng hệ thống vẫn ghi nhận ca này.`,
        { duration: 5000 }
      );
    }

    if (editingTemplate) {
      await handleUpdateShiftTemplate(editingTemplate.id, values);
      cancelEdit();
      setSelectedTemplate(null);
    } else {
      await handleCreateShiftTemplate(values);
      form.reset(EMPTY_FORM);
    }
  }

  async function onDelete(template: ShiftTemplate) {
    setDeletingId(template.id);
    try {
      await handleDeleteShiftTemplate(template.id);
      if (selectedTemplate?.id === template.id) setSelectedTemplate(null);
      if (editingTemplate?.id === template.id) cancelEdit();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Quản lý ca mẫu</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 border-b bg-muted/20 px-6 py-4">
          <Form {...form}>
            <form
              id={FORM_ID}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên ca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ca hành chính" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="group relative">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn('transition-colors', shiftDuration > 8 && 'text-amber-600 dark:text-amber-400 font-semibold')}>
                          Giờ bắt đầu
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className={cn(
                              'transition-colors',
                              shiftDuration > 8 && 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/20 dark:bg-amber-950/20 focus-visible:ring-amber-500/40'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn('transition-colors', shiftDuration > 8 && 'text-amber-600 dark:text-amber-400 font-semibold')}>
                          Giờ kết thúc
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className={cn(
                              'transition-colors',
                              shiftDuration > 8 && 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/20 dark:bg-amber-950/20 focus-visible:ring-amber-500/40'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {shiftDuration > 8 && (
                  <div className="hidden group-hover:block group-focus-within:block absolute z-30 top-full left-0 mt-1.5 w-full rounded-lg bg-amber-50 dark:bg-amber-950/95 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-2.5 text-xs shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="absolute -top-1.5 left-5 size-3 bg-amber-50 dark:bg-amber-950/95 border-t border-l border-amber-200 dark:border-amber-800 rotate-45" />
                    <div className="flex items-start gap-2 relative z-10">
                      <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-300">Cảnh báo thời lượng ca làm việc</p>
                        <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">
                          Ca làm việc này ({shiftDuration} tiếng) đang vượt quá 8 tiếng (vẫn cho phép lưu).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 px-6 py-4">
          <p className="text-sm font-medium">
            Ca mẫu hiện có ({shiftTemplates.length})
          </p>

          {shiftTemplates.length > 4 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc giờ..."
                className="h-9 pl-8"
              />
            </div>
          )}

          {shiftTemplates.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Chưa có ca mẫu nào.
            </p>
          ) : filteredTemplates.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy ca phù hợp.
            </p>
          ) : (
            <>
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                {pagedTemplates.map((template) => {
                  const isHighlighted =
                    selectedTemplate?.id === template.id ||
                    editingTemplate?.id === template.id;
                  return (
                    <li key={template.id}>
                      <button
                        type="button"
                        onClick={() => selectTemplate(template)}
                        onDoubleClick={() => enterEditMode(template)}
                        disabled={isEditing}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                          isEditing
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-muted/50",
                          isHighlighted &&
                            "border-primary bg-primary/5 ring-1 ring-primary/20",
                        )}
                      >
                        <Clock className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {template.name}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {template.startTime} - {template.endTime}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {filteredTemplates.length > LIST_PAGE_SIZE && (
                <div className="flex shrink-0 items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>
                    Trang {activePage + 1}/{totalListPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 cursor-pointer px-2"
                      disabled={activePage === 0}
                      onClick={() => setListPage((p) => Math.max(0, p - 1))}
                    >
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 cursor-pointer px-2"
                      disabled={activePage >= totalListPages - 1}
                      onClick={() =>
                        setListPage((p) =>
                          Math.min(totalListPages - 1, p + 1),
                        )
                      }
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="cursor-pointer"
                disabled={
                  !targetTemplate ||
                  deletingId === targetTemplate.id ||
                  isSubmitting
                }
                onClick={() =>
                  targetTemplate && void onDelete(targetTemplate)
                }
              >
                <Trash2 className="mr-2 size-4" />
                Xóa ca mẫu
              </Button>
              <div className="flex flex-1 justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={cancelEdit}
                >
                  Hủy sửa
                </Button>
                <Button
                  type="submit"
                  form={FORM_ID}
                  size="sm"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  <Pencil className="mr-2 size-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full items-center gap-2">
              {selectedTemplate && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer"
                  disabled={deletingId === selectedTemplate.id || isSubmitting}
                  onClick={() => void onDelete(selectedTemplate)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Xóa
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                {selectedTemplate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={beginEdit}
                  >
                    <Pencil className="mr-2 size-4" />
                    Chỉnh sửa
                  </Button>
                )}
                <Button
                  type="submit"
                  form={FORM_ID}
                  size="sm"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  <Plus className="mr-2 size-4" />
                  Thêm ca mẫu
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
