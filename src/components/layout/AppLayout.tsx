'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useAuth } from '@/context/AuthContext';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('perfilcliente_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  // Protect private routes
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('perfilcliente_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // If on login page, don't show navigation sidebar or headers
  if (pathname === '/login') {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  // Loading state while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060a13] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 animate-spin">
          <div className="w-full h-full bg-[#060a13] rounded-[10px]" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-wider text-slate-500 uppercase">
          Carregando ambiente seguro...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#060a13] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Mobile Top Header (only visible on mobile/tablet < lg) */}
      <MobileHeader onOpenSidebar={() => setIsMobileOpen(true)} />

      {/* Collapsible Sidebar (desktop fixed + mobile drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area - dynamically adjusts left margin for desktop sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-16 lg:pt-0`}
      >
        <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-28">
          {children}
        </main>
      </div>
    </div>
  );
};

