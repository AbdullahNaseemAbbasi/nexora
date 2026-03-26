export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
