import { api } from '@/lib/apiClient'

/** Mot de passe oublié, confirmation d'adresse et avis par email (backend : /api/v1/account). */
export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/api/v1/account/password/forgot', { email }, false)

export const resetPassword = (token: string, newPassword: string) =>
  api.post<{ status: string }>('/api/v1/account/password/reset', { token, new_password: newPassword }, false)

export const verifyEmail = (token: string) => api.post<{ status: string }>('/api/v1/account/email/verify', { token }, false)

export const resendVerification = () => api.post<{ already_verified: boolean }>('/api/v1/account/email/resend')

export const setEmailNotifications = (enabled: boolean) =>
  api.patch<{ email_notifications: boolean }>('/api/v1/account/notifications', { email_notifications: enabled })
