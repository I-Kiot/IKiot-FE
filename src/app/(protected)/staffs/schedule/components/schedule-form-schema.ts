import { z } from "zod";
import {
  MAX_SERIES_DAYS,
  countSeriesDays,
  seriesSpanDays,
} from "@/app/(protected)/staffs/shared/schedule-series";

/** Form phân ca: một ngày, hoặc lặp lại theo khoảng ngày + các thứ trong tuần. */
export const scheduleFormSchema = z
  .object({
    userIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhân viên"),
    shiftTemplateId: z.string().min(1, "Vui lòng chọn ca làm"),
    repeat: z.boolean(),
    workDate: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    weekdays: z.array(z.number().int().min(0).max(6)),
  })
  .superRefine((values, ctx) => {
    if (!values.repeat) {
      if (!values.workDate) {
        ctx.addIssue({
          code: "custom",
          path: ["workDate"],
          message: "Vui lòng chọn ngày",
        });
      }
      return;
    }
    if (!values.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Vui lòng chọn ngày bắt đầu",
      });
    }
    if (!values.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Vui lòng chọn ngày kết thúc",
      });
    }
    if (!values.startDate || !values.endDate) return;
    if (values.startDate > values.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
      return;
    }
    if (seriesSpanDays(values.startDate, values.endDate) > MAX_SERIES_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: `Lịch lặp tối đa ${MAX_SERIES_DAYS} ngày`,
      });
      return;
    }
    if (values.weekdays.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Chọn ít nhất một thứ trong tuần",
      });
      return;
    }
    if (countSeriesDays(values.startDate, values.endDate, values.weekdays) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Không có ngày nào trong khoảng rơi vào các thứ đã chọn",
      });
    }
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
