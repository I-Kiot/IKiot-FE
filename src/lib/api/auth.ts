import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import client from "./client";
import { firebaseApp } from "../firebase";
import { LoginInput, SignupInput } from "../validation";
import { clearCachedUser, clearTokens, getRefreshToken } from "../auth";
import type { User } from "../auth";
import type { LocationRef } from "@/types/location";
import { resetSocket } from "../socket";

/** Đăng nhập, nhận token phiên và hồ sơ người dùng. */
export async function loginUser(data: LoginInput) {
  const response = await client.post("/auth/login", {
    phoneNumber: data.phone,
    password: data.password,
  });

  const accessToken =
    response.data?.accessToken ||
    response.data?.token ||
    response.data?.data?.accessToken ||
    response.data?.data?.token;

  const refreshToken =
    response.data?.refreshToken ||
    response.data?.data?.refreshToken ||
    accessToken;

  const user =
    normalizeSessionUser(response.data?.user ?? response.data?.data?.user) ?? {
      phoneNumber: data.phone,
      name: "User",
    };

  return { accessToken, refreshToken, user };
}

/**
 * Đăng nhập Google qua Firebase, đổi ID token lấy token phiên của backend.
 * Backend yêu cầu email Google đã tồn tại trên hồ sơ người dùng, nếu không sẽ từ chối.
 */
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

  const accessToken =
    response.data?.accessToken || response.data?.data?.accessToken;
  const refreshToken =
    response.data?.refreshToken ||
    response.data?.data?.refreshToken ||
    accessToken;
  const user = normalizeSessionUser(
    response.data?.user ?? response.data?.data?.user,
  );

  return { accessToken, refreshToken, user };
}

/** Kiểm tra SĐT / tên cửa hàng đã được dùng chưa, trước khi gửi OTP để báo ngay và không tốn SMS. */
export async function checkRegistrationAvailability(
  phoneNumber: string,
  tenantName: string,
) {
  const response = await client.post("/auth/check-availability", {
    phoneNumber,
    tenantName,
  });
  return response.data.data as {
    phoneNumberTaken: boolean;
    tenantNameTaken: boolean;
  };
}

/** Gửi OTP qua SMS (eSMS) tới số điện thoại trước khi đăng ký. */
export async function sendOtpRequest(phoneNumber: string) {
  const response = await client.post("/auth/send-otp", { phoneNumber });
  return response.data;
}

/**
 * Đăng ký user và tenant. `otpCode` là mã 6 số nhận qua SMS (hoặc "DEV_BYPASS" khi bỏ qua OTP ở dev).
 */
export async function registerUser(data: SignupInput, otpCode: string) {
  const response = await client.post("/auth/register", {
    phoneNumber: data.phoneNumber,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    tenantName: data.tenantName,
    tenantPhoneNumber: null,
    tenantMainAddress: null,
    tenantTaxNumber: null,
    otpCode,
  });
  return response.data;
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
  // Socket đã xác thực theo user này và backend đã join vào room của họ; không ngắt thì người đăng nhập sau sẽ nhận thông báo của user cũ.
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

/**
 * Đổi user row của backend thành session user. Đưa loại tài khoản (`systemRole`) về lại `role`:
 * backend dùng `role` cho quan hệ Role của tenant, để nguyên thì mọi so sánh `user.role === "..."` sai.
 * Cũng suy ra `branchId` / `warehouseId` từ `location` (BUG-01, docs/bug-log-test-hanh-trinh.md).
 */
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

/**
 * `PATCH /auth/me` - tự sửa hồ sơ. **Body phẳng**: `UpdateMeDto` khai báo mọi trường ở cấp trên cùng,
 * `whitelist: true` sẽ bỏ object `profile` lồng nhau. Chỉ `/users/:id` nhận `profile`.
 */
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
