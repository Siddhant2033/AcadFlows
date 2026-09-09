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
      
      // First try to get from URL slug
      const slug = getTenantSlugFromURL();
      setTenantSlug(slug);
      
      if (slug) {
        try {
          const info = await getTenantInfo(slug);
          if (info) {
            setTenant(info);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.log('Failed to get tenant from slug');
        }
      }
      
      // Try to get from API
      try {
        const response = await api.get('/tenants/current');
        if (response.data.success && response.data.data) {
          setTenant(response.data.data);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        // 404 is fine - no tenant context yet
        if (err.response?.status === 404) {
          console.log('No tenant context available (this is normal)');
        } else if (err.response?.status === 401) {
          console.log('Not authenticated, skipping tenant fetch');
        } else {
          console.error('Error fetching tenant:', err);
        }
      }
      
      // No tenant found - this is okay for public pages
    } catch (err) {
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