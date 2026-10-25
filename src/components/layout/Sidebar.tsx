'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { classes, subjects, teachers, semester } = useTimetableStore();

  const academicNav = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
    { href: '/timetable', label: 'Timetables', icon: 'calendar_month' },
    {
      href: '/generate',
      label: 'Generate Timetable',
      icon: 'auto_mode',
      badge: '4-Yr Engine',
      badgeVariant: 'secondary',
    },
    {
      href: '/teachers',
      label: 'Teachers',
      icon: 'person_search',
      count: teachers.length > 0 ? teachers.length : undefined,
    },
    {
      href: '/subjects',
      label: 'Subjects',
      icon: 'menu_book',
      count: subjects.length > 0 ? subjects.length : undefined,
    },
    {
      href: '/semester',
      label: 'Semesters',
      icon: 'school',
    },
    {
      href: '/classes',
      label: 'Classes & Sections',
      icon: 'groups',
      count: classes.length > 0 ? classes.length : undefined,
    },
    {
      href: '/assignments',
      label: 'Teaching Matrix',
      icon: 'assignment_turned_in',
    },
  ];

  const portalNav = [
    { href: '/teacher-portal', label: 'Teacher Portal', icon: 'badge' },
    { href: '/settings', label: 'Slots & Settings', icon: 'settings' },
    { href: '/timetable/print', label: 'Print / Export PDF', icon: 'print' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white z-50 flex flex-col justify-between border-r border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="p-space-lg flex items-start gap-space-md border-b border-[#f1f5f9]">
          <Link href="/dashboard" className="flex items-center gap-space-md group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4e45d5] to-[#131b2e] flex items-center justify-center text-white shadow-md shadow-[#4e45d5]/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                grid_view
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-[#0b1c30] tracking-tight truncate font-bold">
                Nexus Timetable
              </span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded text-[0.625rem] font-medium bg-[#eff4ff] text-[#45464d] truncate border border-[#c6c6cd]/30 mt-0.5">
                Dept. of Computer Science &amp; Engg
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section 1: Academic Operations */}
        <div className="px-space-md pt-3 pb-1">
          <div className="px-space-sm py-1 font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
            Academic Operations
          </div>
        </div>

        <nav className="flex-1 px-space-md space-y-1 overflow-y-auto">
          {academicNav.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-space-md py-2.5 rounded-lg transition-all font-body-md text-body-md',
                  isActive
                    ? 'bg-[#131b2e] text-white font-semibold shadow-sm'
                    : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                )}
              >
                <div className="flex items-center gap-space-md truncate">
                  <span
                    className={cn(
                      'material-symbols-outlined text-[20px]',
                      isActive ? 'text-white' : 'text-[#76777d]'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold flex-shrink-0',
                      item.badgeVariant === 'secondary'
                        ? isActive
                          ? 'bg-[#89f5e7] text-[#00201d]'
                          : 'bg-[#e3dfff] text-[#100069]'
                        : 'bg-[#d3e4fe] text-[#45464d]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && !item.badge && (
                  <span
                    className={cn(
                      'font-code-cell text-[11px] px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#45464d]'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Section 2: Portal & System */}
          <div className="pt-space-md pb-1">
            <div className="px-space-sm py-1 font-label-sm text-label-sm uppercase tracking-wider text-[#76777d]">
              Portal &amp; System
            </div>
          </div>

          {portalNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-space-md py-2 rounded-lg transition-colors font-body-md text-body-md',
                  isActive
                    ? 'bg-[#131b2e] text-white font-semibold shadow-sm'
                    : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                )}
              >
                <div className="flex items-center gap-space-md truncate">
                  <span
                    className={cn(
                      'material-symbols-outlined text-[20px]',
                      isActive ? 'text-white' : 'text-[#76777d]'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Academic Term & Status Footer */}
      <div className="p-space-md bg-[#eff4ff]/60 border-t border-[#e2e8f0]">
        <div className="p-space-sm rounded-lg bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-[#e2e8f0] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-label-md text-label-md text-[#0b1c30] font-semibold">Active Session</span>
            <span className="inline-flex items-center gap-1 font-label-sm text-[10px] text-[#047857] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" /> Engine Ready
            </span>
          </div>
          <div className="font-code-cell text-[11px] text-[#45464d] truncate">
            {semester.type} Cycle • AY {semester.academicYear || '2026–27'}
          </div>
        </div>
      </div>
    </aside>
  );
}
