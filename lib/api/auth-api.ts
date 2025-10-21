import { api } from '@/lib/api/axios-config'

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  await api.post('/v1/auth/forgot-password', payload)
}

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> => {
  const response = await api.post('/v1/auth/reset-password', payload)
  return response.data
}
