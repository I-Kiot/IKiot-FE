import client from "./client";
import type {
  PaySheetBasicPay,
  PaySheetDetail,
  PaySheetListItem,
  PaySheetListQueryParams,
  PaySheetOption,
  PaySheetPayType,
} from "@/types/paysheet";

interface PaySheetListApiResponse {
  success?: boolean;
  data?: PaySheetListItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const PAY_TYPE_LABELS: Record<PaySheetPayType, string> = {
  FIXED: "Lương cố định",
  PAY_BY_SHIFT: "Theo ca",
  STANDARD_WORKING_DAY: "Theo ngày công chuẩn",
};

export function formatVnd(amount?: number | null): string {
  if (amount == null || !Number.isFinite(Number(amount))) return "-";
  return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

export function describeBasicPay(basicPay?: PaySheetBasicPay | null): string {
  if (!basicPay?.payType) return "";
  const typeLabel = PAY_TYPE_LABELS[basicPay.payType] ?? basicPay.payType;
  switch (basicPay.payType) {
    case "FIXED":
      return `${typeLabel}: ${formatVnd(basicPay.salaryPerPeriod)}/kỳ`;
    case "PAY_BY_SHIFT":
      return `${typeLabel}: ${formatVnd(basicPay.amountPerShift)}/ca`;
    case "STANDARD_WORKING_DAY":
      return `${typeLabel}: ${formatVnd(basicPay.standardWorkingDaySalary)}/ngày`;
    default:
      return typeLabel;
  }
}

function mapPaySheetOption(item: PaySheetListItem): PaySheetOption | null {
  const id = item?.id;
  if (!id || typeof id !== "string") return null;
  if (item.status === "DELETED") return null;
  const summary = describeBasicPay(item.basicPay);
  return {
    value: id,
    label: item.name?.trim() || id,
    summary: summary || undefined,
  };
}

export const paySheetApi = {
  /** GET /payroll/paysheets - TO & BR (paysheets:read). */
  getList: async (
    params?: PaySheetListQueryParams,
  ): Promise<{
    data: PaySheetListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await client.get<PaySheetListApiResponse>(
      "/payroll/paysheets",
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          name: params?.name?.trim() || undefined,
        },
      },
    );

    const data = response.data?.data ?? [];
    const pagination = response.data?.pagination;
    const limit = pagination?.limit ?? (data.length || 1);
    const total = pagination?.total ?? data.length;

    return {
      data,
      total,
      page: pagination?.page ?? params?.page ?? 1,
      totalPages:
        pagination?.totalPages ??
        Math.max(1, Math.ceil(total / (limit || 1))),
    };
  },

  /** GET /payroll/paysheets/{paySheetId} */
  getById: async (paySheetId: string): Promise<PaySheetDetail> => {
    const response = await client.get<{ data?: PaySheetDetail } | PaySheetDetail>(
      `/payroll/paysheets/${paySheetId}`,
    );
    const payload = response.data;
    if (payload && typeof payload === "object" && "data" in payload) {
      const nested = (payload as { data?: PaySheetDetail }).data;
      if (nested?.id) return nested;
    }
    if (payload && typeof payload === "object" && "id" in payload) {
      return payload as PaySheetDetail;
    }
    throw new Error("Không nhận được dữ liệu bảng lương");
  },

  /** Paginate GET /payroll/paysheets for select options. */
  getAllForOptions: async (): Promise<PaySheetOption[]> => {
    const options: PaySheetOption[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 10) {
      const response = await paySheetApi.getList({
        page,
        limit: 100,
      });
      for (const item of response.data) {
        const option = mapPaySheetOption(item);
        if (option) options.push(option);
      }
      totalPages = response.totalPages;
      page += 1;
    }

    return options;
  },
};
