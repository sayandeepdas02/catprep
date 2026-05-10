'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopNavbar } from './top-navbar';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts/shortcut-modal';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-20' : 'ml-[260px]'
        )}
      >
        <TopNavbar />
        <main className="p-6">{children}</main>
      </div>
      <KeyboardShortcutsModal />
    </div>
  );
}