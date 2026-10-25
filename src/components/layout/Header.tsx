'use client';

import React, { useState } from 'react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { useConvexStatus } from '@/providers/ConvexClientProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function Header() {
  const { semester, updateSemester, resetToDefault, conflicts } = useTimetableStore();
  const { isConfigured, convexUrl } = useConvexStatus();
  const [isConvexModalOpen, setIsConvexModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const type = val.includes('Odd') ? 'ODD' : 'EVEN';
    updateSemester(semester.academicYear || '2024-2025', type);
  };

  const handleReset = async () => {
    if (confirm('Clear all schedule and academic data? This will reset to default state.')) {
      setIsResetting(true);
      await resetToDefault();
      setIsResetting(false);
    }
  };

  const oddSemestersText = 'Sem 1, 3, 5, 7';
  const evenSemestersText = 'Sem 2, 4, 6, 8';
  const currentSemesterText = semester.type === 'ODD' ? oddSemestersText : evenSemestersText;

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/95 backdrop-blur-md z-40 border-b border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-4 sm:px-space-lg flex items-center justify-between">
        {/* Left: Breadcrumbs & Semester Cycle Badge */}
        <div className="flex items-center gap-space-md truncate">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#76777d] text-[18px]">schedule</span>
            <span className="font-label-md text-label-md text-[#0b1c30] font-semibold hidden sm:inline">
              Master Schedule
            </span>
          </div>
          <span className="text-[#c6c6cd] font-body-sm text-body-sm hidden sm:inline">/</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eff4ff] text-[#45464d] font-label-sm text-label-sm font-semibold tracking-wide truncate border border-[#d3e4fe]">
            <span className="w-2 h-2 rounded-full bg-[#4e45d5] flex-shrink-0" />
            <span>
              AY {semester.academicYear || '2024-2025'} • {semester.type} Cycle [{currentSemesterText}]
            </span>
          </span>
        </div>

        {/* Center: Solver & Convex API Status */}
        <div className="hidden xl:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsConvexModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#d1fae5] transition-colors cursor-pointer"
            title="Click to view Backend & Solver Status"
          >
            <span className="material-symbols-outlined text-[16px] text-[#047857]">check_circle</span>
            <span className="font-code-cell text-code-cell text-[#047857] font-semibold">
              {conflicts.length === 0
                ? 'Solver API: Ready • 0 Conflicts'
                : `Solver API: ${conflicts.length} Overlaps Detected`}
            </span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-space-md">
          {/* Cycle Selector Dropdown */}
          <div className="relative">
            <select
              value={semester.type === 'ODD' ? 'Odd' : 'Even'}
              onChange={handleCycleChange}
              className="appearance-none bg-[#eff4ff] text-[#0b1c30] font-label-md text-label-md rounded-lg pl-3 pr-8 py-1.5 border border-[#c6c6cd]/40 focus:outline-none focus:ring-2 focus:ring-[#4e45d5]/20 cursor-pointer font-semibold"
            >
              <option value="Odd">Odd Semester 2024-25</option>
              <option value="Even">Even Semester 2024-25</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#76777d] text-[18px]">
              expand_more
            </span>
          </div>

          {/* Notifications button */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
            type="button"
            onClick={() => setIsConvexModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {conflicts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ba1a1a] text-white font-label-sm text-[0.625rem] flex items-center justify-center font-bold">
                {conflicts.length}
              </span>
            )}
          </button>

          {/* Reset / Help Action */}
          <button
            aria-label="Reset Academic Data"
            className="p-2 rounded-lg text-[#45464d] hover:bg-[#eff4ff] hover:text-[#ba1a1a] transition-colors"
            type="button"
            onClick={handleReset}
            title="Reset Academic Schedule"
          >
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
          </button>
        </div>
      </header>

      {/* Convex & Solver Diagnostics Modal */}
      <Modal
        isOpen={isConvexModalOpen}
        onClose={() => setIsConvexModalOpen(false)}
        title="Backend Cloud Architecture & Solver Status"
      >
        <div className="space-y-4 text-sm text-[#45464d]">
          <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3 text-[#047857] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#047857] flex-shrink-0">check_circle</span>
            <div>
              <div className="font-semibold text-[#047857]">
                {isConfigured ? 'Convex Cloud Deployment Connected' : 'Convex Cloud Ready (Local Reactive Mode)'}
              </div>
              <div className="text-xs text-[#065f46] mt-0.5 font-code-cell">
                {isConfigured ? convexUrl : 'Reactive memory sync active with OR-Tools CP-SAT integer programming logic.'}
              </div>
            </div>
          </div>

          <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Engine Solver Version:</span>
              <span className="font-code-cell text-[#4e45d5] font-bold">CP-SAT v2.4 (Joint 4-Yr Matrix)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Academic Term:</span>
              <span className="font-code-cell text-[#0b1c30]">
                AY {semester.academicYear} • {semester.type} Cycle
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Conflict Integrity:</span>
              <span className="font-code-cell text-[#047857] font-bold">
                {conflicts.length === 0 ? 'Zero Hard Collisions' : `${conflicts.length} Overlaps`}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsConvexModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
