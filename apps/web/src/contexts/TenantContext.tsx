import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getTenantSlugFromURL, getTenantInfo, getCurrentTenant } from '../lib/tenant';
import type { TenantInfo } from '../lib/tenant';
import api from '../lib/api';

interface TenantContextType {
  tenant: TenantInfo | null;
  tenantSlug: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Try to get tenant from URL (query param or subdomain)
      const slug = getTenantSlugFromURL();
      setTenantSlug(slug);

      if (slug) {
        const info = await getTenantInfo(slug);
        if (info) {
          setTenant(info);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to the backend's tenant context (cookie / header)
      //    This may return 404 on public pages — that's fine.
      const info = await getCurrentTenant();
      if (info) {
        setTenant(info);
      }
      // If null, tenant stays null — public pages work without it.
    } catch (err) {
      // Only log unexpected errors, not the common 404s
      console.warn('Tenant context error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantSlug,
        isLoading,
        error,
        refetch: fetchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}