'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {(title || subtitle) && (
          <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-950">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-zinc-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}