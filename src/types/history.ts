/** Người làm một thay đổi trong lịch sử (sổ công nợ, giá, ngân hàng). `null` ở phía gọi = hệ thống. */
export interface HistoryPerson {
  id: string;
  phoneNumber: string;
  profile?: { firstName?: string | null; lastName?: string | null } | null;
}

export interface HistoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryPage<T> {
  data: T[];
  pagination: HistoryPagination;
}
