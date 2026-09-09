import { useAuthStore } from "../auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    isLoading,
    error,
    fetchMe,
    logout,
    setUser,
    isAuthenticated: !!user,
  };
}
