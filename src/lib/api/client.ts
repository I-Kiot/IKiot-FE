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
import { notifyLocalMutation } from "@/lib/live-refresh";
import { currentSocketId, resetSocket } from "@/lib/socket";
import { SOCKET_ID_HEADER } from "@/types/change-feed";
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
    const socketId = currentSocketId();
    if (socketId) {
      config.headers[SOCKET_ID_HEADER] = socketId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);
/** Không phải thay đổi dữ liệu nghiệp vụ: đăng nhập/token, upload, thiết bị thông báo, đánh dấu đã đọc. */
const NON_MUTATION_URL = /\/(auth|uploads|notifications)(\/|\?|$)/;

function signalLocalMutation(response: AxiosResponse): void {
  const method = response.config?.method?.toLowerCase();
  if (!method || !WRITE_METHODS.has(method)) return;
  if (NON_MUTATION_URL.test(response.config?.url ?? "")) return;
  notifyLocalMutation();
}

client.interceptors.response.use(
  (response: AxiosResponse) => {
    signalLocalMutation(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Không refresh với endpoint auth.
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/firebase-login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/resend-otp") ||
      originalRequest.url?.includes("/auth/send-forgot-password-otp") ||
      originalRequest.url?.includes("/auth/verify-forgot-password-otp") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password");

    // Chỉ refresh khi 401, hoặc 403 do phiên hết hạn.
    const errorBody = error.response?.data as
      | { code?: string; message?: string }
      | undefined;

    // Dịch `message` sang tiếng Việt theo `code`.
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
        // Đọc token từ cả hai dạng response.
        const body = response.data?.data ?? response.data;
        const accessToken: string | undefined = body?.accessToken;
        // Giữ refresh token cũ nếu backend không cấp mới.
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
