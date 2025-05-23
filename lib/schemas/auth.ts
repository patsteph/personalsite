import { z } from "zod";

// Token validation schema
export const TokenValidationSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .max(5000, "Token is too long")
    .regex(/^[A-Za-z0-9._-]+$/, "Invalid token format")
    .optional(), // Can come from header or body
});

// Login schema
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").max(254, "Email is too long"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),

  rememberMe: z.boolean().optional().default(false),
});

// Password reset schema
export const PasswordResetSchema = z.object({
  email: z.string().email("Invalid email format").max(254, "Email is too long"),
});

// Password change schema
export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "New password must contain at least one lowercase letter, one uppercase letter, and one number",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// User registration schema
export const UserRegistrationSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .max(254, "Email is too long"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      ),

    confirmPassword: z.string(),

    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name is too long")
      .regex(/^[a-zA-Z\s-']+$/, "First name contains invalid characters"),

    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name is too long")
      .regex(/^[a-zA-Z\s-']+$/, "Last name contains invalid characters"),

    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Token refresh schema
export const TokenRefreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
    .max(5000, "Refresh token is too long"),
});

// User profile update schema
export const UserProfileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .regex(/^[a-zA-Z\s-']+$/, "First name contains invalid characters")
    .optional(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .regex(/^[a-zA-Z\s-']+$/, "Last name contains invalid characters")
    .optional(),

  displayName: z.string().max(100, "Display name is too long").optional(),

  bio: z.string().max(500, "Bio is too long").optional(),

  website: z.string().url("Invalid website URL").optional().or(z.literal("")),

  location: z.string().max(100, "Location is too long").optional(),
});

export type TokenValidation = z.infer<typeof TokenValidationSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type PasswordReset = z.infer<typeof PasswordResetSchema>;
export type PasswordChange = z.infer<typeof PasswordChangeSchema>;
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type TokenRefresh = z.infer<typeof TokenRefreshSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
