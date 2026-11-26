import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import client from "./client";
import { firebaseApp } from "../firebase";
import { LoginInput, SignupInput } from "../validation";
import { clearCachedUser, clearTokens, getRefreshToken } from "../auth";
import type { User } from "../auth";
import type { LocationRef } from "@/types/location";
import { resetSocket } from "../socket";

/** Phiên đăng nhập: token + hồ sơ người dùng. */
export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

/** Thử thách OTP qua email mà backend trả thay cho phiên (đăng nhập lần đầu, đăng ký, quên mật khẩu). */
export interface OtpChallenge {
  requiresOtp: true;
  challengeToken: string;
  /** Email đã che, ví dụ `ng***@gmail.com`. */
  sentTo: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

/** Kết quả đăng nhập: hoặc phiên, hoặc thử thách OTP cần hoàn tất. */
export type LoginResult = SessionResult | OtpChallenge;

export function isOtpChallenge(result: unknown): result is OtpChallenge {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { requiresOtp?: unknown }).requiresOtp === true
  );
}

/** Lấy payload trong envelope `{ success, message, data }` (chịu được cả dạng không bọc). */
/** Payload đăng nhập / thử thách OTP của backend (mọi trường tuỳ chọn vì hai dạng dùng chung). */
interface AuthPayload extends Partial<OtpChallenge> {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: ApiSessionUser;
  resetToken?: string;
}

function unwrap(body: { data?: AuthPayload } & AuthPayload): AuthPayload {
  return body?.data ?? body;
}

function toChallenge(payload: AuthPayload): OtpChallenge {
  return {
    requiresOtp: true,
    challengeToken: payload.challengeToken as string,
    sentTo: payload.sentTo as string,
    expiresInSeconds: payload.expiresInSeconds as number,
    resendAfterSeconds: payload.resendAfterSeconds as number,
  };
}

function toSession(payload: AuthPayload): SessionResult {
  const accessToken = (payload?.accessToken || payload?.token) as string;
  const refreshToken = payload?.refreshToken || accessToken;
  return { accessToken, refreshToken, user: normalizeSessionUser(payload?.user) };
}

/** Đăng nhập bằng SĐT hoặc email; chưa xác minh email thì nhận thử thách OTP. */
export async function loginUser(data: LoginInput): Promise<LoginResult> {
  const response = await client.post("/auth/login", {
    identifier: data.identifier.trim(),
    password: data.password,
  });
  const payload = unwrap(response.data);
  return payload?.requiresOtp ? toChallenge(payload) : toSession(payload);
}

/** Nhập mã OTP của thử thách đăng nhập / đăng ký để nhận phiên. */
export async function verifyLoginOtp(
  challengeToken: string,
  otpCode: string,
): Promise<SessionResult> {
  const response = await client.post("/auth/login/verify-otp", {
    challengeToken,
    otpCode,
  });
  return toSession(unwrap(response.data));
}

/** Gửi lại mã cho một thử thách đang mở. Trả lại thông tin gửi mới (không đổi `challengeToken`). */
export async function resendOtp(challengeToken: string) {
  const response = await client.post("/auth/resend-otp", { challengeToken });
  return unwrap(response.data) as Pick<
    OtpChallenge,
    "sentTo" | "expiresInSeconds" | "resendAfterSeconds"
  >;
}

/** Đăng nhập Google qua Firebase, đổi ID token lấy phiên của backend. */
export async function loginWithGoogle() {
  const auth = getAuth(firebaseApp);
  const provider = new GoogleAuthProvider();
  // Luôn cho người dùng chọn tài khoản Google.
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  // Chỉ cần ID token để đổi lấy JWT; đóng phiên Firebase phía client để không còn sót lại.
  await auth.signOut().catch(() => {});

  const response = await client.post("/auth/firebase-login", {
    idToken,
    platform: "web",
  });

  return toSession(unwrap(response.data));
}

/** Kiểm SĐT / email / tên cửa hàng đã được dùng chưa. */
export async function checkRegistrationAvailability(fields: {
  phoneNumber?: string;
  email?: string;
  tenantName?: string;
}) {
  const response = await client.post("/auth/check-availability", fields);
  return response.data.data as {
    phoneNumberTaken?: boolean;
    emailTaken?: boolean;
    tenantNameTaken?: boolean;
  };
}

/** Đăng ký chủ cửa hàng; hoàn tất bằng `verifyLoginOtp`. */
export async function registerUser(data: SignupInput): Promise<OtpChallenge> {
  const response = await client.post("/auth/register", {
    phoneNumber: data.phoneNumber,
    email: data.email.trim(),
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    tenantName: data.tenantName,
    tenantPhoneNumber: null,
    tenantMainAddress: null,
    tenantTaxNumber: null,
  });
  return toChallenge(unwrap(response.data));
}

/** Quên mật khẩu bước 1: gửi OTP tới email của tài khoản (nhập SĐT hoặc email). */
export async function sendForgotPasswordOtp(identifier: string): Promise<OtpChallenge> {
  const response = await client.post("/auth/send-forgot-password-otp", {
    identifier: identifier.trim(),
  });
  return toChallenge(unwrap(response.data));
}

/** Quên mật khẩu bước 2: đổi mã OTP lấy `resetToken` (dùng một lần, 15 phút). */
export async function verifyForgotPasswordOtp(
  challengeToken: string,
  otpCode: string,
) {
  const response = await client.post("/auth/verify-forgot-password-otp", {
    challengeToken,
    otpCode,
  });
  return unwrap(response.data).resetToken as string;
}

/** Quên mật khẩu bước 3: đặt mật khẩu mới bằng `resetToken`. */
export async function resetPassword(token: string, newPassword: string) {
  await client.post("/auth/reset-password", { token, newPassword });
}

/** Đăng xuất: gọi API rồi xoá dữ liệu local. */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await client.post(
        `/auth/logout`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
    } catch (error) {
      console.error("Logout API error:", error);
    }
  }

  // Luôn xoá thông tin đăng nhập ở local, kể cả khi gọi API lỗi.
  clearTokens();
  clearCachedUser();
  // Ngắt socket để người đăng nhập sau không nhận thông báo của user cũ.
  resetSocket();
}

/** Dạng user mà `/auth/me` và `/auth/login` trả về. */
interface ApiSessionUser {
  systemRole?: string;
  /** Quan hệ Role do tenant định nghĩa, là object, không phải loại tài khoản. */
  role?: { id?: string; name?: string } | null;
  /** Nơi làm việc (`SESSION_USER_INCLUDE` của AuthService); null với chủ shop hoặc admin. */
  location?: LocationRef | null;
  [key: string]: unknown;
}

// Tách nơi làm việc của tài khoản thành branchId / warehouseId theo loại địa điểm.
function postingIds(location: LocationRef | null | undefined): Pick<User, "branchId" | "warehouseId"> {
  if (location?.type === "BRANCH") return { branchId: location.id, warehouseId: undefined };
  if (location?.type === "WAREHOUSE") return { branchId: undefined, warehouseId: location.id };
  return { branchId: undefined, warehouseId: undefined };
}

/** Đổi user của backend thành session user: `systemRole` về `role`, suy ra `branchId` / `warehouseId` từ `location`. */
export function normalizeSessionUser(
  user: ApiSessionUser | undefined,
): User | undefined {
  if (!user) return undefined;
  const { role, systemRole, location, ...rest } = user;
  return {
    ...(rest as unknown as User),
    systemRole,
    role: systemRole,
    roleName: role?.name,
    location: location ?? null,
    ...postingIds(location),
  };
}

export async function getMe() {
  const response = await client.get<{ success: boolean; data: ApiSessionUser }>(
    "/auth/me",
  );
  return normalizeSessionUser(response.data.data);
}

/** `PATCH /auth/me`: tự sửa hồ sơ, body phẳng. */
export async function updateMe(payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  gender?: string;
  dob?: string;
  taxNumber?: string;
  identificationId?: string;
}) {
  const response = await client.patch<{ success: boolean; data: any }>(
    "/auth/me",
    payload,
  );
  return response.data.data;
}

/** Tự đổi mật khẩu của mình (`POST /auth/change-password`). */
export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  reEnterPassword: string;
}) {
  await client.post("/auth/change-password", payload);
}
