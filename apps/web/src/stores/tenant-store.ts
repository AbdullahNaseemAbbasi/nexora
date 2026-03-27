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

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  currentTenant: null,

  setTenants: (tenants) => {
    set({ tenants });
    // Auto-select first tenant if none selected
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
}));
