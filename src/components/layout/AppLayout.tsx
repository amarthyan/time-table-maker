'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans selection:bg-[#e3dfff] selection:text-[#100069] antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area offset by 72 (18rem) on lg screens */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header />
        <main className="relative pt-20 sm:pt-24 pb-16 min-h-screen bg-[#f8f9ff] w-full px-4 sm:px-space-lg max-w-[1720px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
