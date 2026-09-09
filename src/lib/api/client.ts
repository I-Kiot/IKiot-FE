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

// Create axios instance
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
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
      // Neither branch used to fire when the refresh came back without a usable token,
      // and a queued request that is never resolved *or* rejected is a spinner that
      // never stops. Failing them is the honest outcome: the refresh did not work.
      prom.onFailed(
        new AxiosError("Token refresh produced no access token"),
      );
    }
  });

  failedQueue = [];
};

/**
 * Request interceptor - Add access token to headers
 */
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

/**
 * Response interceptor - Handle 401 and auto-refresh token
 */
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't refresh for auth endpoints (login, register, refresh, etc.).
    // These 401s mean "bad credentials / email not registered", not "token
    // expired" - refreshing then redirecting would just bounce the user back
    // to /sign-in and swallow the real error message.
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

    // Dịch `message` sang tiếng Việt ngay tại biên, theo `code`.
    //
    // Backend trả `message` bằng **tiếng Anh** (nó là câu cho log/Swagger), còn `code` mới
    // là thứ ổn định. Khoảng 30 file trong app đọc thẳng `error.response.data.message` rồi
    // đổ lên toast; sửa từng chỗ là 30 lần lặp lại cùng một việc, nên chỗ dịch đặt ở đây -
    // một biên duy nhất, đúng nơi response đi vào app. Mã không có trong bảng thì giữ
    // nguyên message của backend.
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
        // The backend wraps every body as `{ success, data }`, so the tokens are one
        // level down. Destructuring `response.data` gave `undefined` for both: the string
        // "undefined" went into localStorage, the queued requests below resolved with
        // neither a token nor an error and hung forever, and the presented refresh token
        // had already been rotated away server-side - so the session was gone every 15
        // minutes. `loginUser` in ../auth.ts handles both shapes; this did not.
        const body = response.data?.data ?? response.data;
        const accessToken: string | undefined = body?.accessToken;
        // Rotation always issues a new one; keeping the presented token as the fallback
        // means a backend that stopped rotating would degrade rather than sign everyone out.
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

        // Redirect to login
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
