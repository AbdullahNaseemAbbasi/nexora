export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const PLAN_LIMITS = {
  FREE: {
    maxMembers: 3,
    maxProjects: 2,
    maxTasksPerProject: 50,
    maxAiRequestsPerDay: 10,
    maxStorageMB: 500,
  },
  PRO: {
    maxMembers: 20,
    maxProjects: -1, // unlimited
    maxTasksPerProject: -1,
    maxAiRequestsPerDay: 100,
    maxStorageMB: 10240,
  },
  ENTERPRISE: {
    maxMembers: -1,
    maxProjects: -1,
    maxTasksPerProject: -1,
    maxAiRequestsPerDay: -1,
    maxStorageMB: 51200,
  },
} as const;
