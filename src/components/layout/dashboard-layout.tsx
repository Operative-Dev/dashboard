'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-12 md:pt-0">
        {title && (
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-zinc-800 bg-zinc-950 shrink-0">
            <h1 className="text-xl md:text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h1>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
