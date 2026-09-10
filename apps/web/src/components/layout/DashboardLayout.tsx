import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '../../lib/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Optional: full width content (no left/right padding). Default false. */
  bare?: boolean;
}

export default function DashboardLayout({ children, bare = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content — offset by sidebar on desktop, full width on mobile */}
      <main
        className={cn(
          'pt-16 md:pl-64',
          'min-h-screen',
          'w-full',
          'transition-[padding] duration-300',
        )}
      >
        <div
          className={cn(
            // Key: no max-width, no mx-auto. Full width.
            'w-full',
            !bare && 'px-4 sm:px-6 lg:px-8 py-6',
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}