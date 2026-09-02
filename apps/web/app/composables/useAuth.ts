import type { AuthUser } from '~/types';

export function useAuthUser() {
  return useState<AuthUser | null>('auth-user', () => null);
}

export function useAuth() {
  const user = useAuthUser();

  async function fetchMe() {
    try {
      const res = await apiFetch<{ user: AuthUser }>('/auth/me');
      user.value = res.user;
      return res.user;
    } catch {
      user.value = null;
      return null;
    }
  }

  async function signup(input: { firstName: string; lastName: string; email: string; password: string }) {
    return apiFetch<{ email: string; cooldownSeconds: number }>('/auth/signup', {
      method: 'POST',
      body: input,
    });
  }

  async function verifyOtp(input: { email: string; code: string; purpose: 'signup_verify' | 'password_reset' }) {
    const res = await apiFetch<{ user?: AuthUser; resetToken?: string }>('/auth/verify-otp', {
      method: 'POST',
      body: input,
    });
    if (res.user) user.value = res.user;
    return res;
  }

  async function resendOtp(input: { email: string; purpose: 'signup_verify' | 'password_reset' }) {
    return apiFetch<{ ok: true; cooldownSeconds: number }>('/auth/resend-otp', {
      method: 'POST',
      body: input,
    });
  }

  async function signin(input: { email: string; password: string; remember: boolean }) {
    const res = await apiFetch<{ user: AuthUser }>('/auth/signin', { method: 'POST', body: input });
    user.value = res.user;
    return res.user;
  }

  async function forgotPassword(email: string) {
    return apiFetch<{ ok: true; cooldownSeconds: number }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async function resetPassword(input: { resetToken: string; password: string }) {
    const res = await apiFetch<{ user: AuthUser }>('/auth/reset-password', { method: 'POST', body: input });
    user.value = res.user;
    return res.user;
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    user.value = null;
  }

  return { user, fetchMe, signup, verifyOtp, resendOtp, signin, forgotPassword, resetPassword, logout };
}
