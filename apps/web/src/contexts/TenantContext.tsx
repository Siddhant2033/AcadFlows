import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getTenantSlugFromURL, getTenantInfo } from '../lib/tenant';
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
      
      const slug = getTenantSlugFromURL();
      setTenantSlug(slug);
      
      if (slug) {
        const info = await getTenantInfo(slug);
        if (info) {
          setTenant(info);
        } else {
          // Try to get tenant from current API
          try {
            const response = await api.get('/tenants/current');
            if (response.data.success && response.data.data) {
              setTenant(response.data.data);
            }
          } catch (err) {
            console.log('No tenant found from current endpoint');
          }
        }
      } else {
        // No slug in URL, try to get from API
        try {
          const response = await api.get('/tenants/current');
          if (response.data.success && response.data.data) {
            setTenant(response.data.data);
          }
        } catch (err) {
          // Silent fail - user might not be authenticated
          console.log('No tenant context available');
        }
      }
    } catch (err) {
      console.error('Tenant provider error:', err);
      setError('Failed to load tenant information');
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