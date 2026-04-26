import { create } from "zustand";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  _count?: {
    members: number;
    projects: number;
  };
}

interface Overview {
  totalProjects: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  inReviewTasks: number;
  tasksByStatus?: Record<string, number>;
}

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  overview: Overview | null;
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant) => void;
  setOverview: (overview: Overview | null) => void;
  hydrate: () => boolean;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  currentTenant: null,
  overview: null,
  setOverview: (overview) => set({ overview }),

  setTenants: (tenants) => {
    localStorage.setItem("tenants", JSON.stringify(tenants));
    set({ tenants });
    const savedId = localStorage.getItem("currentTenantId");
    const found = tenants.find((t) => t.id === savedId);
    if (found) {
      set({ currentTenant: found });
    } else if (tenants.length > 0) {
      localStorage.setItem("currentTenantId", tenants[0].id);
      set({ currentTenant: tenants[0] });
    }
  },

  setCurrentTenant: (tenant) => {
    localStorage.setItem("currentTenantId", tenant.id);
    set({ currentTenant: tenant });
  },

  hydrate: () => {
    try {
      const tenantsStr = localStorage.getItem("tenants");
      if (tenantsStr) {
        const tenants = JSON.parse(tenantsStr);
        if (tenants.length > 0) {
          const savedId = localStorage.getItem("currentTenantId");
          const found = tenants.find((t: Tenant) => t.id === savedId);
          set({ tenants, currentTenant: found || tenants[0] });
          return true;
        }
      }
    } catch {}
    return false;
  },
}));
