import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  clearCachedUser,
} from "@/lib/auth";
import { resetSocket } from "@/lib/socket";
import { TOKEN_EXPIRED_CODES, messageForCode } from "@/lib/api/error-codes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3800";

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailed: (error: AxiosError) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onFailed(error);
    } else if (token) {
      prom.onSuccess(token);
    } else {
      // Refresh không ra token dùng được thì phải reject các request đang chờ; để treo thì spinner quay mãi.
      prom.onFailed(
        new AxiosError("Token refresh produced no access token"),
      );
    }
  });

  failedQueue = [];
};

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Không refresh với endpoint auth: 401 ở đó là sai thông tin / email chưa đăng ký, không phải token hết hạn.
    // Refresh rồi redirect sẽ đẩy người dùng về /sign-in và nuốt mất lỗi thật.
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/firebase-login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password");

    // Chỉ refresh token khi 401, hoặc 403 mà backend nói rõ là phiên hết hạn.
    // 403 thông thường là thiếu quyền/subscription - retry không giúp.
    //
    // Backend mới gửi `code`; chuỗi "Invalid or expired token." là của backend cũ và
    // được giữ lại cho tới khi cutover xong - so khớp nguyên văn một câu chữ chính là
    // thứ khiến vòng refresh chết nếu ai đó sửa câu đó.
    const errorBody = error.response?.data as
      | { code?: string; message?: string }
      | undefined;

    // Dịch `message` sang tiếng Việt tại biên theo `code`: backend trả `message` tiếng Anh, còn `code` mới ổn định.
    // Mã không có trong bảng thì giữ nguyên message của backend.
    const localized = messageForCode(errorBody?.code);
    if (localized && errorBody) errorBody.message = localized;
    const isTokenExpired =
      error.response?.status === 401 ||
      (error.response?.status === 403 &&
        (TOKEN_EXPIRED_CODES.has(errorBody?.code ?? "") ||
          errorBody?.message === "Invalid or expired token."));

    if (
      isTokenExpired &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            onSuccess: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            onFailed: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenFromStorage = getRefreshToken();
        if (!refreshTokenFromStorage) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: refreshTokenFromStorage },
          { withCredentials: true },
        );
        // Backend bọc body trong `{ success, data }`, token nằm lớp dưới. Đọc thẳng `response.data` từng làm
        // token thành `undefined` và phiên mất sau 15 phút. Xử lý cả hai dạng như `loginUser` trong ../auth.ts.
        const body = response.data?.data ?? response.data;
        const accessToken: string | undefined = body?.accessToken;
        // Backend rotate thì luôn cấp refresh token mới; giữ token cũ làm dự phòng để nếu backend ngừng rotate chỉ xuống cấp, không đăng xuất mọi người.
        const refreshToken: string = body?.refreshToken ?? refreshTokenFromStorage;
        if (!accessToken) {
          throw new Error("Refresh response carried no access token");
        }

        setTokens({ accessToken, refreshToken });
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        clearCachedUser();
        resetSocket();

        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;
