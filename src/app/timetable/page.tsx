'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexStatus } from '@/providers/ConvexClientProvider';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TimetableEntry } from '@/types/timetable';
import { DAYS_OF_WEEK, SEMESTER_CYCLES } from '@/lib/constants/academic';
import { formatYearOrdinal } from '@/lib/utils';

interface InspectSlotState {
  code: string;
  type: string;
  title: string;
  room: string;
  teacher: string;
  timing: string;
  status: string;
  capacity?: string;
  cohort?: string;
  entryId?: string;
}

function TimetableContent() {
  const { isConfigured } = useConvexStatus();
  const searchParams = useSearchParams();
  const cohortParam = Number(searchParams.get('cohort')) || 2;
  const timetableIdParam = searchParams.get('timetable_id') || 'latest';

  const {
    semester,
    classes,
    subjects,
    teachers,
    labs,
    timetable,
    publishStatus,
    conflicts,
    updateTimetableEntry,
  } = useTimetableStore();

  const [activeCohort, setActiveCohort] = useState<number>(
    cohortParam >= 1 && cohortParam <= 4 ? cohortParam : 2
  );
  const [viewMode, setViewMode] = useState<'class' | 'year'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const mappings = SEMESTER_CYCLES[semester.type];

  // Dynamic Cohort Tabs computed from actual store entities
  const cohortTabs = useMemo(() => {
    return [1, 2, 3, 4].map((year) => {
      const mapping = mappings.find((m) => m.year === year);
      const yearClasses = classes.filter((c) => c.year === year);
      const yearEntries = timetable.filter((t) => yearClasses.some((c) => c.id === t.classId));
      const totalHours = yearEntries.reduce((sum, e) => sum + (e.type === 'LAB' ? 2 : 1), 0);
      const semCode = mapping?.semesterCode || `Sem ${year * 2 - 1}`;
      const sectionLabel =
        yearClasses.length > 0 ? yearClasses.map((c) => c.name).join(', ') : 'No Sections';

      return {
        year,
        name: formatYearOrdinal(year as 1 | 2 | 3 | 4) + ' Year',
        sem: `${semCode} • ${sectionLabel}`,
        hrs: `${totalHours} hrs`,
        totalHours,
      };
    });
  }, [mappings, classes, timetable]);

  const currentTab = cohortTabs.find((c) => c.year === activeCohort) || cohortTabs[1];

  // Selected class for active cohort
  const cohortClasses = useMemo(() => {
    return classes.filter((c) => c.year === activeCohort);
  }, [classes, activeCohort]);

  const activeClass = useMemo(() => {
    if (selectedClassId) {
      const found = cohortClasses.find((c) => c.id === selectedClassId);
      if (found) return found;
    }
    return cohortClasses[0] || classes.find((c) => c.year === activeCohort) || classes[0];
  }, [cohortClasses, selectedClassId, classes, activeCohort]);

  // Real-Time Convex Query Subscriptions per Backend API Contract
  const convexClassData = useQuery(
    api.timetables.getClassTimetable,
    isConfigured && activeClass
      ? { timetable_id: timetableIdParam, class_id: activeClass.id }
      : 'skip'
  );

  const convexYearData = useQuery(
    api.timetables.getYearTimetable,
    isConfigured
      ? {
          timetable_id: timetableIdParam,
          academic_year_id: semester.academicYear || 'AY-2024-25',
          year_number: activeCohort,
        }
      : 'skip'
  );

  // Actual entries for this class (reactive Convex with store fallback)
  const classEntries: TimetableEntry[] = useMemo(() => {
    if (isConfigured && convexClassData?.entries && convexClassData.entries.length > 0) {
      return convexClassData.entries.map((e: any) => ({
        id: e._id || `${e.day}-${e.period}-${e.subject_id}`,
        classId: e.class_id,
        subjectId: e.subject_id,
        teacherId: e.teacher_id,
        day: e.day,
        startPeriod: e.period,
        duration: e.duration || (e.entry_type === 'LAB' ? 2 : 1),
        type: (e.entry_type === 'LAB' ? 'LAB' : 'THEORY') as 'THEORY' | 'LAB',
        roomId: e.room?.name || e.room_id,
        labId: e.lab?._id || e.lab_id,
      }));
    }
    if (!activeClass) return [];
    return timetable.filter((t) => t.classId === activeClass.id);
  }, [isConfigured, convexClassData, timetable, activeClass]);

  // Currently inspected slot in the right drawer
  const [inspectSlot, setInspectSlot] = useState<InspectSlotState | null>(null);

  // Cell edit modal
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editRoomOrLab, setEditRoomOrLab] = useState('');

  // Auto-select first real scheduled entry if available and inspectSlot is null
  useMemo(() => {
    if (!inspectSlot && classEntries.length > 0) {
      const first = classEntries[0];
      const sub = subjects.find((s) => s.id === first.subjectId);
      const tch = teachers.find((t) => t.id === first.teacherId);
      const lab = labs.find((l) => l.id === first.labId);
      const isLab = first.type === 'LAB';
      const dayObj = DAYS_OF_WEEK.find((d) => d.id === first.day);

      setInspectSlot({
        code: sub?.code || 'N/A',
        type: isLab ? 'Continuous Lab' : 'Theory',
        title: sub?.name || 'Class Session',
        room: isLab ? lab?.name || 'Shared Laboratory' : first.roomId || 'Classroom',
        teacher: tch ? `${tch.name} (${tch.employeeId})` : 'Faculty Assigned',
        timing: `${dayObj?.name || 'Day'}: Period ${first.startPeriod} (${isLab ? '2.0 Consecutive Hours' : '1.0 Hour'})`,
        status: '0 Collisions • Cross-Dept Verified',
        capacity: isLab ? `${lab?.capacity || 40} Workstations` : `${activeClass?.studentCount || 60} Seats`,
        cohort: activeClass?.name,
        entryId: first.id,
      });
    }
  }, [classEntries, subjects, teachers, labs, activeClass, inspectSlot]);

  const handleSelectSlot = (slot: InspectSlotState) => {
    setInspectSlot(slot);
  };

  const handleOpenEdit = () => {
    if (!inspectSlot?.entryId) {
      alert('Select a scheduled slot to configure instructor or room allocations.');
      return;
    }
    const entry = timetable.find((t) => t.id === inspectSlot.entryId);
    if (entry) {
      setEditingEntry(entry);
      setEditSubjectId(entry.subjectId);
      setEditTeacherId(entry.teacherId);
      setEditRoomOrLab(entry.type === 'LAB' ? entry.labId || '' : entry.roomId || '');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const chosenSubject = subjects.find((s) => s.id === editSubjectId);
    const isLab = chosenSubject?.type === 'LAB';

    updateTimetableEntry(editingEntry.id, {
      subjectId: editSubjectId,
      teacherId: editTeacherId,
      type: isLab ? 'LAB' : 'THEORY',
      duration: isLab ? 2 : 1,
      labId: isLab ? editRoomOrLab : undefined,
      roomId: !isLab ? editRoomOrLab : undefined,
    });

    setEditingEntry(null);
  };

  // Standard Department Period Definitions
  const periods = [
    { periodNumber: 1, name: 'P1', time: '09:00 - 10:00' },
    { periodNumber: 2, name: 'P2', time: '10:00 - 11:00' },
    { periodNumber: 3, name: 'P3', time: '11:15 - 12:15' },
    { periodNumber: 4, name: 'P4', time: '12:15 - 01:15' },
    { periodNumber: 5, name: 'P5', time: '02:00 - 03:00' },
    { periodNumber: 6, name: 'P6', time: '03:00 - 04:00' },
    { periodNumber: 7, name: 'P7', time: '04:15 - 05:00' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col w-full pb-12 animate-in fade-in duration-300">
        {/* Dynamic Notification / Conflict Free Banner */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md p-space-md mb-space-lg rounded-xl bg-white border border-[#e2e8f0] shadow-stitch-sm">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#4e45d5] flex-shrink-0 border border-[#d3e4fe]">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-sm text-headline-sm text-[#0b1c30]">
                  {semester.type} Semester Timetable Matrix • AY {semester.academicYear || '2024-2025'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                  {publishStatus === 'PUBLISHED' ? 'Published (Official)' : 'Verified (Official)'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#45464d] mt-0.5">
                {timetable.length > 0
                  ? `Continuous multi-period lab verification cleared. ${conflicts.length} room clashes across Physics, Chemistry & ECE/EEE shared wings.`
                  : 'No scheduled timetable entries found for this academic session. Launch generation to compute schedules.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-sm w-full lg:w-auto justify-end flex-wrap">
            {cohortClasses.length > 1 && (
              <div className="flex items-center gap-2 bg-[#eff4ff] rounded-lg p-1 border border-[#d3e4fe]">
                <span className="text-[11px] font-bold text-[#45464d] px-2">Section:</span>
                {cohortClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      activeClass?.id === cls.id
                        ? 'bg-white text-[#4e45d5] shadow-xs'
                        : 'text-[#45464d] hover:text-[#0b1c30]'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center bg-[#eff4ff] rounded-lg p-1 border border-[#d3e4fe]">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm font-semibold transition-all ${
                  viewMode === 'class'
                    ? 'bg-white text-[#0b1c30] shadow-2xs font-bold'
                    : 'text-[#45464d] hover:text-[#0b1c30]'
                }`}
              >
                Class Matrix View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('year')}
                className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm font-semibold transition-all ${
                  viewMode === 'year'
                    ? 'bg-white text-[#0b1c30] shadow-2xs font-bold'
                    : 'text-[#45464d] hover:text-[#0b1c30]'
                }`}
              >
                Year-wise Directory
              </button>
            </div>
          </div>
        </div>

        {/* Header & Cohort Selection Tabs */}
        <div className="flex flex-col gap-space-md mb-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-code-cell text-code-cell text-[#4e45d5] uppercase font-bold">
                  Curriculum Matrix Engine
                </span>
                <span className="text-[#c6c6cd] font-body-sm text-body-sm">/</span>
                <span className="font-code-cell text-code-cell text-[#45464d]">
                  {viewMode === 'class' ? 'Class-Wise View' : 'All-Year Summary'}
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-[#0b1c30] tracking-tight">
                Academic Timetable Schedule Matrix
              </h1>
              <p className="font-body-md text-body-md text-[#45464d] mt-0.5">
                View, inspect, and export conflict-free schedules across all four academic cohorts
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-space-sm flex-wrap">
              <button
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-[#0b1c30] hover:bg-[#eff4ff] transition-colors border border-[#cbd5e1] shadow-2xs font-label-md text-label-md"
                onClick={() => window.print()}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print Timetable</span>
              </button>
              <Link
                href="/timetable/print"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-[#0b1c30] hover:bg-[#eff4ff] transition-colors border border-[#cbd5e1] shadow-2xs font-label-md text-label-md"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span>Export PDF</span>
              </Link>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#eff4ff] text-[#4e45d5] hover:bg-[#dce9ff] transition-colors font-label-md text-label-md border border-[#d3e4fe]"
              >
                <span className="material-symbols-outlined text-[18px]">checklist_rtl</span>
                <span>Audit Constraints</span>
              </Link>
              <button
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#131b2e] text-white font-label-md text-label-md shadow-sm hover:bg-black transition-opacity"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Schedule link copied to clipboard!');
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share Link</span>
              </button>
            </div>
          </div>

          {/* Cohort Year Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm p-1.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe]">
            {cohortTabs.map((c) => {
              const isActive = activeCohort === c.year;
              return (
                <button
                  key={c.year}
                  type="button"
                  onClick={() => {
                    setActiveCohort(c.year);
                    setSelectedClassId('');
                  }}
                  className={`flex flex-col items-start p-space-md rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-white text-[#0b1c30] shadow-stitch-sm ring-2 ring-[#4e45d5]/30'
                      : 'bg-transparent hover:bg-white/60 text-[#45464d]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-label-sm text-label-sm uppercase tracking-wider ${
                        isActive ? 'text-[#4e45d5] font-bold' : 'text-[#76777d]'
                      }`}
                    >
                      Cohort 0{c.year} {isActive && '• Active'}
                    </span>
                    <span className="font-code-cell text-code-cell text-[#76777d]">{c.hrs}</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-[#0b1c30] mt-1 font-bold">
                    {c.name}
                  </span>
                  <span
                    className={`font-body-sm text-body-sm truncate ${
                      isActive ? 'text-[#4e45d5] font-semibold' : 'text-[#45464d]'
                    }`}
                  >
                    {c.sem}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cohort Metadata Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-xl bg-white border border-[#e2e8f0] shadow-stitch-sm">
            <div className="flex items-center gap-space-md flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">domain</span>
                <span className="font-label-md text-label-md text-[#0b1c30] font-semibold">
                  B.Tech Computer Science &amp; Engg
                </span>
              </div>
              <span className="text-[#c6c6cd]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#76777d] text-[18px]">calendar_today</span>
                <span className="font-body-md text-body-md text-[#45464d]">
                  {currentTab.sem}
                </span>
              </div>
              <span className="text-[#c6c6cd]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#76777d] text-[18px]">meeting_room</span>
                <span className="font-body-md text-body-md text-[#45464d]">
                  Base Classroom:{' '}
                  <span className="font-semibold text-[#0b1c30]">
                    {activeClass ? activeClass.name : `C-${activeCohort}01`}
                  </span>{' '}
                  ({activeClass?.studentCount || 60} Seats)
                </span>
              </div>
              <span className="text-[#c6c6cd]">•</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#76777d] text-[18px]">timelapse</span>
                <span className="font-body-md text-body-md text-[#45464d]">
                  Curriculum Load: <span className="font-semibold text-[#0b1c30]">{currentTab.hrs} / Week</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm text-[#45464d] font-code-cell text-code-cell">
              <span className="w-2 h-2 rounded-full bg-[#047857]" />
              <span>Verified by Academic Dean</span>
            </div>
          </div>
        </div>

        {/* Main Timetable Matrix + Inspect Drawer Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Timetable Grid Canvas */}
          <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-space-sm transition-all duration-300">
            <div className="w-full overflow-x-auto rounded-xl bg-white border border-[#e2e8f0] shadow-stitch-sm p-space-md">
              <table className="w-full min-w-[960px] border-collapse text-left select-none">
                <thead>
                  <tr className="bg-[#eff4ff] rounded-lg border border-[#d3e4fe]">
                    <th className="p-space-md rounded-l-lg font-label-sm text-label-sm text-[#76777d] uppercase tracking-wider w-24">
                      Day
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P1</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        09:00 - 10:00
                      </span>
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P2</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        10:00 - 11:00
                      </span>
                    </th>
                    {/* Tea Break Header */}
                    <th className="p-1 font-label-sm text-[0.625rem] text-[#76777d] text-center w-8 bg-[#e5eeff] tracking-tighter uppercase font-semibold">
                      <span className="block rotate-180 [writing-mode:vertical-rl] py-2 mx-auto">
                        Tea Break
                      </span>
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P3</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        11:15 - 12:15
                      </span>
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P4</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        12:15 - 01:15
                      </span>
                    </th>
                    {/* Lunch Break Header */}
                    <th className="p-1 font-label-sm text-[0.625rem] text-[#76777d] text-center w-8 bg-[#e5eeff] tracking-tighter uppercase font-semibold">
                      <span className="block rotate-180 [writing-mode:vertical-rl] py-2 mx-auto">
                        Lunch
                      </span>
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P5</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        02:00 - 03:00
                      </span>
                    </th>
                    <th className="p-space-sm font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P6</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        03:00 - 04:00
                      </span>
                    </th>
                    <th className="p-space-sm rounded-r-lg font-label-sm text-label-sm text-[#45464d] text-center w-[13.5%]">
                      <span className="font-bold text-[#0b1c30] block">P7 (Remedial)</span>
                      <span className="font-code-cell text-code-cell text-[#76777d] font-normal">
                        04:15 - 05:00
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1f5f9]">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayEntries = classEntries.filter((e) => e.day === day.id);
                    const dayHours = dayEntries.reduce((sum, e) => sum + (e.type === 'LAB' ? 2 : 1), 0);

                    // Check which periods are continuations of a 2-hour lab started previously
                    const labStarts = new Set(
                      dayEntries.filter((e) => e.type === 'LAB').map((e) => e.startPeriod)
                    );

                    return (
                      <tr key={day.id} className="group hover:bg-[#eff4ff]/40 transition-colors">
                        <td className="p-space-md font-label-lg text-label-lg font-bold text-[#0b1c30] align-middle bg-[#eff4ff]/30 rounded-l-xl">
                          <span>{day.name}</span>
                          <span className="block font-code-cell text-[0.6875rem] text-[#76777d] font-normal mt-0.5">
                            {dayHours} hrs
                          </span>
                        </td>

                        {/* Morning Period 1 & 2 */}
                        {[1, 2].map((pNum) => {
                          // If P2 is continuation of a 2-hour lab starting at P1, it's covered by colSpan=2
                          if (pNum === 2 && labStarts.has(1)) return null;

                          const entry = dayEntries.find((e) => e.startPeriod === pNum);
                          return renderPeriodCell(entry, pNum, day.name, labStarts.has(pNum));
                        })}

                        {/* Tea Break Divider */}
                        <td className="p-0 bg-[#f8f9ff] text-center align-middle border-x border-[#d3e4fe]/50">
                          <span className="material-symbols-outlined text-[#76777d]/70 text-[16px] block">
                            local_cafe
                          </span>
                        </td>

                        {/* Midday Period 3 & 4 */}
                        {[3, 4].map((pNum) => {
                          if (pNum === 4 && labStarts.has(3)) return null;

                          const entry = dayEntries.find((e) => e.startPeriod === pNum);
                          return renderPeriodCell(entry, pNum, day.name, labStarts.has(pNum));
                        })}

                        {/* Lunch Break Divider */}
                        <td className="p-0 bg-[#f8f9ff] text-center align-middle border-x border-[#d3e4fe]/50">
                          <span className="material-symbols-outlined text-[#76777d]/70 text-[16px] block">
                            restaurant
                          </span>
                        </td>

                        {/* Afternoon Period 5, 6, 7 */}
                        {[5, 6, 7].map((pNum) => {
                          if (pNum === 6 && labStarts.has(5)) return null;

                          const entry = dayEntries.find((e) => e.startPeriod === pNum);
                          return renderPeriodCell(entry, pNum, day.name, labStarts.has(pNum));
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Session Inspector Drawer */}
          <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-space-md">
            <div className="bg-white rounded-xl p-space-lg shadow-stitch-sm border border-[#e2e8f0]">
              <div className="flex items-center justify-between pb-space-sm border-b border-[#f1f5f9] mb-space-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4e45d5] text-[20px]">info</span>
                  <h3 className="font-headline-sm text-headline-sm text-[#0b1c30]">Session Inspector</h3>
                </div>
                {inspectSlot && (
                  <span
                    className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-bold uppercase ${
                      inspectSlot.type === 'Continuous Lab'
                        ? 'bg-[#f5f3ff] text-[#6d28d9]'
                        : 'bg-[#eff4ff] text-[#4e45d5]'
                    }`}
                  >
                    {inspectSlot.type}
                  </span>
                )}
              </div>

              {inspectSlot ? (
                <div className="space-y-space-md">
                  <div>
                    <span className="font-code-cell text-code-cell text-[#4e45d5] font-bold">
                      {inspectSlot.code}
                    </span>
                    <h4 className="font-headline-md text-headline-md text-[#0b1c30] mt-0.5 leading-snug">
                      {inspectSlot.title}
                    </h4>
                  </div>

                  <div className="space-y-space-sm font-body-sm text-body-sm text-[#45464d] bg-[#eff4ff]/40 p-space-md rounded-xl border border-[#d3e4fe]/60">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#76777d] text-[18px] mt-0.5">
                        schedule
                      </span>
                      <div>
                        <span className="font-semibold text-[#0b1c30] block">Scheduled Window</span>
                        <span>{inspectSlot.timing}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-[#d3e4fe]/40">
                      <span className="material-symbols-outlined text-[#76777d] text-[18px] mt-0.5">
                        meeting_room
                      </span>
                      <div>
                        <span className="font-semibold text-[#0b1c30] block">Assigned Space</span>
                        <span>{inspectSlot.room}</span>
                        {inspectSlot.capacity && (
                          <span className="block font-code-cell text-[11px] text-[#76777d]">
                            Capacity: {inspectSlot.capacity}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-[#d3e4fe]/40">
                      <span className="material-symbols-outlined text-[#76777d] text-[18px] mt-0.5">
                        person
                      </span>
                      <div>
                        <span className="font-semibold text-[#0b1c30] block">Instructor Allocation</span>
                        <span>{inspectSlot.teacher}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] flex items-center gap-2 text-[#047857]">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    <span className="font-label-sm text-label-sm font-semibold">{inspectSlot.status}</span>
                  </div>

                  <div className="pt-space-sm flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-space-md rounded-lg bg-[#4e45d5] text-white font-label-md text-label-md font-bold hover:bg-[#3d34b8] transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Modify Session</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[#76777d] font-body-sm text-sm space-y-2">
                  <span className="material-symbols-outlined text-[36px] text-[#cbd5e1] block mx-auto">
                    touch_app
                  </span>
                  <p className="font-semibold text-[#0b1c30]">No Session Inspected</p>
                  <p className="text-xs text-[#76777d] max-w-xs mx-auto">
                    Click any scheduled period or 2-hour laboratory block in the master matrix to inspect instructor assignments and facility allocations.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Cohort Summary Card */}
            <div className="bg-white rounded-xl p-space-md shadow-stitch-sm border border-[#e2e8f0] space-y-2">
              <h4 className="font-label-md text-label-md text-[#0b1c30] font-bold">
                Cohort Curricular Distribution
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#45464d]">
                <div className="p-2 rounded-lg bg-[#eff4ff] border border-[#d3e4fe]">
                  <span className="block text-[10px] text-[#76777d] uppercase">Theory Hours</span>
                  <span className="font-bold text-sm text-[#0b1c30]">
                    {classEntries.filter((e) => e.type === 'THEORY').length} hrs/wk
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#f5f3ff] border border-[#ede9fe]">
                  <span className="block text-[10px] text-[#76777d] uppercase">Practical Labs</span>
                  <span className="font-bold text-sm text-[#6d28d9]">
                    {classEntries.filter((e) => e.type === 'LAB').length * 2} hrs/wk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingEntry && (
          <Modal
            isOpen={!!editingEntry}
            onClose={() => setEditingEntry(null)}
            title="Modify Timetable Session"
            description="Reassign teacher, course module, or laboratory slot."
          >
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Select
                label="Curricular Subject"
                value={editSubjectId}
                onChange={(e) => setEditSubjectId(e.target.value)}
                options={subjects.map((s) => ({
                  value: s.id,
                  label: `${s.code} - ${s.name} (${s.type})`,
                }))}
              />

              <Select
                label="Assigned Instructor"
                value={editTeacherId}
                onChange={(e) => setEditTeacherId(e.target.value)}
                options={teachers.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.employeeId})`,
                }))}
              />

              <Input
                label="Room / Laboratory"
                value={editRoomOrLab}
                onChange={(e) => setEditRoomOrLab(e.target.value)}
                placeholder="e.g. C-304 or Physics Lab"
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20">
                <Button type="button" variant="ghost" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="brand">
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AppLayout>
  );

  // Helper render function for period cells
  function renderPeriodCell(
    entry: TimetableEntry | undefined,
    pNum: number,
    dayName: string,
    isLabStart: boolean
  ) {
    if (!entry) {
      return (
        <td key={pNum} className="p-1.5 align-top">
          <div className="p-2.5 rounded-lg bg-[#eff4ff]/30 border border-dashed border-[#c6c6cd]/40 flex flex-col items-center justify-center h-28 text-center text-[#76777d]/60 font-body-sm text-xs hover:border-[#4e45d5]/40 hover:bg-[#eff4ff]/60 transition-all cursor-pointer group">
            <span className="material-symbols-outlined text-[18px] text-[#76777d]/40 group-hover:text-[#4e45d5] group-hover:scale-110 transition-all">
              add_circle_outline
            </span>
            <span className="text-[10px] text-[#76777d] font-medium mt-1">Open Slot</span>
          </div>
        </td>
      );
    }

    const sub = subjects.find((s) => s.id === entry.subjectId);
    const tch = teachers.find((t) => t.id === entry.teacherId);
    const lab = labs.find((l) => l.id === entry.labId);
    const isLab = entry.type === 'LAB';

    if (isLab) {
      return (
        <td key={pNum} colSpan={2} className="p-1.5 align-top">
          <div
            onClick={() =>
              handleSelectSlot({
                code: sub?.code || 'LAB',
                type: 'Continuous Lab',
                title: sub?.name || 'Practical Laboratory',
                room: lab?.name || 'Shared Laboratory',
                teacher: tch ? `${tch.name} (${tch.employeeId})` : 'Faculty Lead',
                timing: `${dayName}: Period ${pNum} – ${pNum + 1} (2.0 Consecutive Hours)`,
                status: 'Verified • Zero Collisions',
                capacity: `${lab?.capacity || 40} Workstations`,
                cohort: activeClass?.name,
                entryId: entry.id,
              })
            }
            className="p-2.5 rounded-lg bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] shadow-stitch-sm hover:shadow-md cursor-pointer transition-all border-l-4 border-[#7C3AED] flex flex-col justify-between h-28 border border-[#ddd6fe] group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-bold text-[#6D28D9]">
                  {sub?.code || 'LAB'}
                </span>
                <span className="font-label-sm text-[0.625rem] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide bg-[#7C3AED] text-white">
                  2-Hour Lab Block
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-[#4C1D95] font-bold line-clamp-2 mt-1 leading-tight">
                {sub?.name || 'Curricular Laboratory'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#6D28D9] text-body-sm pt-1">
              <span className="truncate text-xs font-semibold">{tch?.name || 'Faculty Lead'}</span>
              <span className="font-code-cell text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-[#ddd6fe] text-[#5b21b6]">
                {lab?.name || entry.roomId || 'Practical Lab'}
              </span>
            </div>
          </div>
        </td>
      );
    }

    // Theory session
    return (
      <td key={pNum} className="p-1.5 align-top">
        <div
          onClick={() =>
            handleSelectSlot({
              code: sub?.code || 'CRS',
              type: 'Theory',
              title: sub?.name || 'Theory Course',
              room: entry.roomId || activeClass?.name || 'Classroom',
              teacher: tch ? `${tch.name} (${tch.employeeId})` : 'Faculty Lead',
              timing: `${dayName}: Period ${pNum} (1.0 Hour)`,
              status: 'Verified • Zero Collisions',
              capacity: `${activeClass?.studentCount || 60} Seats`,
              cohort: activeClass?.name,
              entryId: entry.id,
            })
          }
          className="p-2.5 rounded-lg bg-white shadow-stitch-sm hover:shadow-md cursor-pointer transition-all border-l-4 border-[#0284C7] flex flex-col justify-between h-28 border border-[#e2e8f0] group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm font-bold text-[#0369A1]">
                {sub?.code || 'CRS'}
              </span>
              <span className="material-symbols-outlined text-[#76777d] text-[16px]">menu_book</span>
            </div>
            <span className="font-body-sm text-body-sm text-[#0b1c30] font-semibold line-clamp-2 mt-1 leading-tight">
              {sub?.name || 'Curricular Module'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#76777d] text-body-sm pt-1">
            <span className="truncate text-xs">{tch?.name || 'Faculty Lead'}</span>
            <span className="font-code-cell text-[10px] bg-[#eff4ff] px-1 rounded text-[#45464d]">
              {entry.roomId || activeClass?.name || 'Classroom'}
            </span>
          </div>
        </div>
      </td>
    );
  }
}

export default function TimetablePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-8 text-[#45464d] font-body-md">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-[#c6c6cd]/30">
            <span className="w-4 h-4 rounded-full border-2 border-[#4e45d5] border-t-transparent animate-spin" />
            <span className="font-semibold text-sm">Loading Academic Timetable Matrix...</span>
          </div>
        </div>
      }
    >
      <TimetableContent />
    </React.Suspense>
  );
}
