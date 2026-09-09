import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getTenantSlugFromURL, getTenantInfo } from '../lib/tenant';
import type { TenantInfo } from '../lib/tenant';

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
      
      const slug = getTenantSlugFromURL();
      setTenantSlug(slug);
      
      if (slug) {
        const info = await getTenantInfo(slug);
        if (info) {
          setTenant(info);
        } else {
          setError('Tenant not found');
          setTenant(null);
        }
      } else {
        // No tenant in URL, try to get from API
        try {
          const response = await fetch('/api/v1/tenants/current', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setTenant(data.data);
            }
          }
        } catch (err) {
          // Silent fail - user might not be logged in
        }
      }
    } catch (err) {
      setError('Failed to load tenant information');
      console.error('Tenant provider error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{
      tenant,
      tenantSlug,
      isLoading,
      error,
      refetch: fetchTenant,
    }}>
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