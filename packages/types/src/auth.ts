import { UserRole, AccountStatus } from './enums';

// ============================================
// AUTH TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: Date | null;
  stripeCustomerId: string | null;
  stripeConnectId: string | null;
}

export interface SessionUser extends AuthUser {
  brandProfileId?: string;
  creatorProfileId?: string;
  agencyProfileId?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ============================================
// AUTH DTOs
// ============================================

export interface RegisterDto {
  email: string;
  password: string;
  role: 'BRAND' | 'CREATOR' | 'AGENCY';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// OAUTH TYPES
// ============================================

export interface OAuthProfile {
  provider: 'google' | 'meta' | 'tiktok';
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

// ============================================
// VALIDATION
// ============================================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_REGEX.test(password);
}
