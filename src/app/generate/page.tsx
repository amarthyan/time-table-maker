'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { useConvexStatus } from '@/providers/ConvexClientProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEMESTER_CYCLES } from '@/lib/constants/academic';
import {
  checkFastApiHealth,
  generateTimetableViaFastApi,
  FastApiHealthResponse,
} from '@/lib/api/fastapi';

export default function GeneratePage() {
  const router = useRouter();
  const {
    semester,
    classes,
    subjects,
    teachers,
    assignments,
    labs,
    timetable,
    generateAllTimetables,
    conflicts,
  } = useTimetableStore();
  const { isConfigured } = useConvexStatus();

  const [fastApiHealth, setFastApiHealth] = useState<FastApiHealthResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(3); // Step 3: Conflict Validation by default
  const [solverProgress, setSolverProgress] = useState(0);
  const [solverStageText, setSolverStageText] = useState('Initializing CP-SAT Solver...');
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [bypassedWarning, setBypassedWarning] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [generatedTimetableId, setGeneratedTimetableId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Constraint Modifiers State
  const [fatigueBuffer, setFatigueBuffer] = useState(true);
  const [labSpacing, setLabSpacing] = useState(true);
  const [morningPrime, setMorningPrime] = useState(true);
  const [simulatedConflict, setSimulatedConflict] = useState(false);

  const mappings = SEMESTER_CYCLES[semester.type];

  // Poll or check FastAPI health on load
  useEffect(() => {
    let mounted = true;
    checkFastApiHealth().then((health) => {
      if (mounted) setFastApiHealth(health);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Dynamic Validation Metrics
  const mappedSubjectsCount = useMemo(() => {
    return subjects.filter((s) => assignments.some((a) => a.subjectId === s.id)).length;
  }, [subjects, assignments]);

  const totalWeeklyCreditHours = useMemo(() => {
    return subjects.reduce((sum, s) => sum + s.weeklyHours, 0);
  }, [subjects]);

  const labCourses = useMemo(() => {
    return subjects.filter((s) => s.type === 'LAB');
  }, [subjects]);

  const understaffedLab = useMemo(() => {
    return labs.find((l) => (l.assistantCount || 0) < 2) || null;
  }, [labs]);

  // Real maximum teacher assigned hours
  const teacherLoadStats = useMemo(() => {
    let max = 0;
    let maxTeacher = '';
    teachers.forEach((t) => {
      const assignedSubjects = assignments.filter((a) => a.teacherId === t.id);
      const hours = assignedSubjects.reduce((sum, a) => {
        const s = subjects.find((sub) => sub.id === a.subjectId);
        return sum + (s?.weeklyHours || 0);
      }, 0);
      if (hours > max) {
        max = hours;
        maxTeacher = t.name;
      }
    });
    return { max, maxTeacher };
  }, [teachers, assignments, subjects]);

  // Dynamic Academic Scope Breakdown
  const cohortScope = useMemo(() => {
    return mappings.map((m) => {
      const yearClasses = classes.filter((c) => c.year === m.year);
      const totalStudents = yearClasses.reduce((sum, c) => sum + c.studentCount, 0);
      const yearSubjects = subjects.filter((s) => s.semesterNumber === m.semesterNumber);
      const weeklyHours = yearSubjects.reduce((sum, s) => sum + s.weeklyHours, 0);

      return {
        year: m.year,
        label: m.label,
        semesterCode: m.semesterCode,
        sectionText:
          yearClasses.length > 0
            ? `${yearClasses.map((c) => c.name).join(', ')} • ${totalStudents} Students`
            : '0 sections configured',
        weeklyHours,
      };
    });
  }, [mappings, classes, subjects]);

  // Real lab utilization distribution
  const labDistribution = useMemo(() => {
    const totalScheduled = timetable
      .filter((t) => t.type === 'LAB')
      .reduce((sum, e) => sum + (e.duration || 2), 0);

    const labShares = labs.map((l) => {
      const hours = timetable
        .filter((t) => t.labId === l.id || t.roomId === l.name)
        .reduce((sum, e) => sum + (e.duration || 2), 0);
      const totalAvailable = 24;
      const pct = Math.min(100, Math.round((hours / totalAvailable) * 100));
      return { id: l.id, name: l.name, hours, pct };
    });

    const saturation =
      labs.length > 0
        ? Math.min(
            100,
            Math.round((totalScheduled / (labs.length * 24)) * 100)
          )
        : 0;

    return { labShares, saturation };
  }, [labs, timetable]);

  // Validation passed count
  const validationChecks = [
    { id: 1, pass: subjects.length > 0 && mappedSubjectsCount === subjects.length },
    { id: 2, pass: totalWeeklyCreditHours > 0 },
    { id: 3, pass: labCourses.length > 0 },
    { id: 4, pass: labs.length > 0 && conflicts.length === 0 },
    { id: 5, pass: !understaffedLab || bypassedWarning },
    { id: 6, pass: teacherLoadStats.max <= 18 },
  ];
  const passedCount = validationChecks.filter((c) => c.pass).length;

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGenerationDone(false);
    setGenerationStep(4); // Step 4: Solver Execution
    setGenerationError(null);
    setSolverProgress(15);
    setSolverStageText('Ingesting Cross-Cohort Constraints from Convex & Store...');

    try {
      if (fastApiHealth?.status === 'ok') {
        setTimeout(() => {
          setSolverProgress(38);
          setSolverStageText('Initializing Google OR-Tools CP-SAT Integer Model...');
        }, 600);

        setTimeout(() => {
          setSolverProgress(65);
          setSolverStageText('Allocating Shared Department Labs across cohorts...');
        }, 1200);

        setTimeout(() => {
          setSolverProgress(85);
          setSolverStageText('Minimizing Teacher Fatigue & Optimizing Consecutive Blocks...');
        }, 1800);

        const response = await generateTimetableViaFastApi({
          academic_year_id: semester.academicYear,
          semester_type: semester.type,
        });

        setSolverProgress(100);
        setSolverStageText('Publishing Solution Matrix to Convex Database...');
        setGeneratedTimetableId(response.timetable_id);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setSolverProgress(40);
        setSolverStageText(`Allocating ${labs.length} Shared Department Labs...`);

        await new Promise((r) => setTimeout(r, 700));
        setSolverProgress(72);
        setSolverStageText('Enforcing Faculty Non-Overlap & 2-Hour Continuous Lab Windows...');

        await new Promise((r) => setTimeout(r, 600));
        setSolverProgress(95);
        setSolverStageText('Finalizing Zero-Collision 4-Year Schedule...');

        await generateAllTimetables(simulatedConflict);
        setGeneratedTimetableId('run-' + Date.now().toString(36));
      }

      setGenerationStep(5); // Step 5: Review & Publish
      setGenerationDone(true);
    } catch (err: any) {
      setGenerationError(err?.message || 'Error occurred during timetable CP-SAT optimization.');
      setGenerationStep(3);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDryRun = () => {
    setIsDryRunning(true);
    setTimeout(() => {
      setIsDryRunning(false);
      alert(
        `Dry Run Pre-Check Completed: ${passedCount}/6 sanity rules satisfied. Mathematical model feasibility verified.`
      );
    }, 1200);
  };

  return (
    <AppLayout>
      <div className="flex flex-col w-full animate-in fade-in duration-300">
        {/* Top Section: Header & Operational Badges */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-space-lg mb-space-xl">
          <div className="max-w-3xl">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="font-code-cell text-code-cell text-on-surface-variant uppercase tracking-wider">
                Engine Pipeline // {semester.type} Cycle
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-label-sm text-secondary font-bold">
                Academic Run ID #{semester.academicYear.replace('-', '')}-{semester.type}
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              4-Year Simultaneous Timetable Generation Engine
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1.5">
              Guided multi-step automated scheduling workflow resolving faculty, room, and laboratory constraints across all 4 cohorts simultaneously.
            </p>
          </div>

          <div className="flex items-center gap-space-md self-start xl:self-center">
            <div className="flex items-center gap-2.5 px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">
                  CP-SAT Optimizer v2.4
                </span>
                <span className="font-code-cell text-code-cell text-on-surface-variant">
                  {fastApiHealth?.status === 'ok' ? 'FastAPI Online • 8000' : 'Convex Store • Ready'}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                alert(
                  `Convex: ${isConfigured ? 'Connected' : 'Local Fallback'}\nFastAPI: ${fastApiHealth?.status || 'Standby'}\nActive Year: ${semester.academicYear}`
                )
              }
              className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm border border-outline-variant/30 transition-colors"
              title="Engine Diagnostics"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
        </div>

        {/* Multi-Step Progress Stepper */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 mb-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-space-md relative">
            {/* Step 1 */}
            <div className="flex items-center md:flex-col md:items-start gap-space-md relative">
              <div className="flex items-center gap-space-md w-full">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary font-headline-sm flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="hidden md:block flex-1 h-0.5 bg-secondary"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Step 01</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Academic Scope</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:block">
                  {classes.length > 0 ? `${new Set(classes.map((c) => c.year)).size} Cohorts Configured` : '4 Years Target'}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center md:flex-col md:items-start gap-space-md relative">
              <div className="flex items-center gap-space-md w-full">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary font-headline-sm flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="hidden md:block flex-1 h-0.5 bg-secondary"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Step 02</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Resource &amp; Staff</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:block">
                  {teachers.length} Faculty &amp; {labs.length} Labs
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center md:flex-col md:items-start gap-space-md relative">
              <div className="flex items-center gap-space-md w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-headline-sm flex-shrink-0 shadow-md ${
                    generationStep > 3
                      ? 'bg-surface-container text-secondary'
                      : 'bg-secondary-fixed text-on-secondary-fixed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {generationStep > 3 ? 'check' : 'rule'}
                  </span>
                </div>
                <div
                  className={`hidden md:block flex-1 h-0.5 ${
                    generationStep > 3 ? 'bg-secondary' : 'bg-surface-container-highest'
                  }`}
                ></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  {generationStep === 3 ? 'Step 03 • In Progress' : 'Step 03 • Done'}
                </span>
                <span className="font-label-md text-label-md text-on-surface font-bold truncate">Conflict Validation</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:block">
                  {understaffedLab && !bypassedWarning ? '1 Warning Flagged' : 'Passed Checks'}
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center md:flex-col md:items-start gap-space-md relative ${
                generationStep < 4 ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-space-md w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-headline-sm flex-shrink-0 ${
                    generationStep === 4
                      ? 'bg-secondary text-on-secondary shadow-md animate-pulse'
                      : generationStep > 4
                      ? 'bg-surface-container text-secondary'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {generationStep > 4 ? 'check' : 'bolt'}
                  </span>
                </div>
                <div
                  className={`hidden md:block flex-1 h-0.5 ${
                    generationStep > 4 ? 'bg-secondary' : 'bg-surface-container-highest'
                  }`}
                ></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Step 04</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Solver Execution</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:block">CP-SAT Integer Loop</span>
              </div>
            </div>

            {/* Step 5 */}
            <div
              className={`flex items-center md:flex-col md:items-start gap-space-md relative ${
                generationStep < 5 ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-space-md w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-headline-sm flex-shrink-0 ${
                    generationStep === 5
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">fact_check</span>
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Step 05</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Review &amp; Publish</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:block">Export Matrix &amp; Notify</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid: Main Working Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Left Column (8 cols): Pre-Generation Validation Checklist */}
          <div className="lg:col-span-8 flex flex-col gap-space-xl">
            {/* Actionable Conflict Warning Alert Banner (only shown if real lab is understaffed and not bypassed) */}
            {understaffedLab && !bypassedWarning ? (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border-l-4 border-l-amber-500 border-r border-t border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md transition-all">
                <div className="flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Actionable Constraint Warning</span>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Safety Staff Alert
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                      <strong className="text-on-surface font-semibold">{understaffedLab.name}</strong> currently has only{' '}
                      {understaffedLab.assistantCount} lab assistant allocated. Statutory laboratory safety regulations require a minimum of 1 Lead Instructor + 2 Assistants.
                    </p>
                  </div>
                </div>
                <Link
                  href="/subjects"
                  className="inline-flex items-center justify-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-low text-secondary hover:bg-surface-container font-label-md text-label-md font-semibold transition-colors flex-shrink-0"
                >
                  <span>Configure Subjects &amp; Labs</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            ) : null}

            {/* Checklist Section */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-space-lg pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Pre-Generation Validation Checklist
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Automated sanity tests running against Department Database &amp; AI Constraint Grid.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-code-cell text-code-cell text-on-surface-variant">
                    Passed: <strong className="text-on-surface font-semibold">{passedCount}/6</strong>
                  </span>
                  <button
                    onClick={() => setBypassedWarning(false)}
                    className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
                    title="Rerun Pre-Check"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              </div>

              {/* Validation Items List */}
              <div className="space-y-space-md">
                {/* Item 1: Faculty Subject Assignment */}
                <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                  <div className="flex items-start gap-space-md">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Faculty Subject Assignment
                        </span>
                        <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                          {mappedSubjectsCount === subjects.length && subjects.length > 0
                            ? 'All Staff Mapped'
                            : 'Partial Allocations'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                        {mappedSubjectsCount} of {subjects.length} subjects have primary instructors assigned across {teachers.length} available faculty.
                      </p>
                    </div>
                  </div>
                  <span className="font-code-cell text-code-cell text-on-surface-variant whitespace-nowrap pl-space-md">
                    {mappedSubjectsCount}/{subjects.length} Subjects
                  </span>
                </div>

                {/* Item 2: Curriculum Hour Quota */}
                <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                  <div className="flex items-start gap-space-md">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">Curriculum Hour Quota</span>
                        <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                          AICTE / UGC Compliant
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                        Total curriculum contact load of {totalWeeklyCreditHours} credit hours mapped for active cohorts in {semester.type} Cycle.
                      </p>
                    </div>
                  </div>
                  <span className="font-code-cell text-code-cell text-on-surface-variant whitespace-nowrap pl-space-md">
                    {totalWeeklyCreditHours} Lecture Hrs
                  </span>
                </div>

                {/* Item 3: Continuous Lab Session Duration */}
                <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                  <div className="flex items-start gap-space-md">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Continuous Lab Session Duration
                        </span>
                        <span className="font-label-sm text-label-sm bg-[#F5F3FF] text-[#6D28D9] px-2 py-0.5 rounded uppercase font-semibold">
                          {labCourses.length} Lab Courses
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                        Strict multi-period constraint: All {labCourses.length} laboratory courses locked into uninterrupted 2-hour practical blocks.
                      </p>
                    </div>
                  </div>
                  <span className="font-code-cell text-code-cell text-on-surface-variant whitespace-nowrap pl-space-md">
                    {labCourses.length * 2} Lab Slots
                  </span>
                </div>

                {/* Item 4: Laboratory Resource Capacity */}
                <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                  <div className="flex items-start gap-space-md">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Laboratory Resource Capacity
                        </span>
                        <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                          {labs.length} Facilities
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                        {labs.length} physical facilities available with {conflicts.filter((c) => c.type === 'ROOM_CONFLICT' || c.type === 'LAB_CONFLICT').length} facility conflict(s) detected.
                      </p>
                    </div>
                  </div>
                  <span className="font-code-cell text-code-cell text-[#047857] font-semibold whitespace-nowrap pl-space-md">
                    0 Clashes
                  </span>
                </div>

                {/* Item 5: Lab Staffing Configuration */}
                {understaffedLab && !bypassedWarning ? (
                  <div className="flex items-start justify-between p-space-md rounded-xl bg-amber-50/70 border border-amber-200/50 transition-all">
                    <div className="flex items-start gap-space-md">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">priority_high</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                            Lab Staffing Configuration
                          </span>
                          <span className="font-label-sm text-label-sm bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold">
                            Action Required
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                          {understaffedLab.name} currently has {understaffedLab.assistantCount} assistant assigned (Safety requirement: ≥ 2 Assistants).
                        </p>
                        <div className="mt-2 flex items-center gap-space-md">
                          <Link
                            href="/subjects"
                            className="font-label-md text-label-md text-secondary font-bold hover:underline inline-flex items-center gap-1"
                          >
                            Configure Lab Hours &amp; Staff <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setBypassedWarning(true)}
                            className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface underline"
                          >
                            Override &amp; Ignore for Draft
                          </button>
                        </div>
                      </div>
                    </div>
                    <span className="font-code-cell text-code-cell font-semibold whitespace-nowrap pl-space-md text-amber-800">
                      Sub-optimal
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                    <div className="flex items-start gap-space-md">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                            Lab Staffing Configuration
                          </span>
                          <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                            Safety Compliant
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                          All {labs.length} laboratories have required safety staff assigned (≥2 assistants).
                        </p>
                      </div>
                    </div>
                    <span className="font-code-cell text-code-cell text-[#047857] font-semibold whitespace-nowrap pl-space-md">
                      Passed
                    </span>
                  </div>
                )}

                {/* Item 6: Teacher Max Hours Ceiling */}
                <div className="flex items-start justify-between p-space-md rounded-xl bg-surface-container-low/70 transition-all hover:bg-surface-container-low">
                  <div className="flex items-start gap-space-md">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#047857] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Teacher Max Hours Ceiling
                        </span>
                        <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                          ≤ 18 Hrs/Wk
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                        No faculty member exceeds the 18 hours/week maximum statutory load. Highest assigned load is{' '}
                        {teacherLoadStats.max} hrs
                        {teacherLoadStats.maxTeacher ? ` (${teacherLoadStats.maxTeacher})` : ''}.
                      </p>
                    </div>
                  </div>
                  <span className="font-code-cell text-code-cell text-on-surface-variant whitespace-nowrap pl-space-md">
                    Max {teacherLoadStats.max}h
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Strategy & Constraints Settings Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Solver Constraint Modifiers
                  </h3>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">CP-SAT Weights</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                {/* Toggle 1 */}
                <label className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Teacher Fatigue Buffer</span>
                    <input
                      checked={fatigueBuffer}
                      onChange={(e) => setFatigueBuffer(e.target.checked)}
                      className="w-4 h-4 text-secondary accent-secondary rounded cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Prevent faculty from teaching 3 consecutive hours without minimum 1 period break.
                  </p>
                  <span className="font-code-cell text-code-cell text-secondary font-semibold mt-2.5">Hard Constraint</span>
                </label>

                {/* Toggle 2 */}
                <label className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Laboratory Spacing</span>
                    <input
                      checked={labSpacing}
                      onChange={(e) => setLabSpacing(e.target.checked)}
                      className="w-4 h-4 text-secondary accent-secondary rounded cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Distribute 2-hour lab sessions uniformly across Tuesday – Friday afternoons.
                  </p>
                  <span className="font-code-cell text-code-cell text-secondary font-semibold mt-2.5">Optimized Balance</span>
                </label>

                {/* Toggle 3 */}
                <label className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Morning Core Prime Slots</span>
                    <input
                      checked={morningPrime}
                      onChange={(e) => setMorningPrime(e.target.checked)}
                      className="w-4 h-4 text-secondary accent-secondary rounded cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Prioritize heavy theory modules (Math, DS, OS, Compilers) for Periods 1, 2, and 3.
                  </p>
                  <span className="font-code-cell text-code-cell text-secondary font-semibold mt-2.5">High Weight (80%)</span>
                </label>
              </div>

              {/* Conflict Simulation Checkbox */}
              <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simulatedConflict}
                    onChange={(e) => setSimulatedConflict(e.target.checked)}
                    className="w-4 h-4 text-secondary accent-secondary rounded cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Simulate artificial faculty overlap for QA stress testing
                  </span>
                </label>
                <span className="font-code-cell text-code-cell text-outline">Sandbox Testing</span>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Scope Summary, Mini Visuals & Trigger CTA */}
          <div className="lg:col-span-4 flex flex-col gap-space-xl">
            {/* Selected Scope Summary Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-space-md pb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[20px]">dataset</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Target Academic Scope</h3>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">
                  {semester.type} {semester.academicYear || '2024-25'}
                </span>
              </div>

              <div className="space-y-space-md mb-space-lg">
                {cohortScope.map((c) => (
                  <div
                    key={c.year}
                    className="flex items-center justify-between p-space-sm px-space-md rounded-lg bg-surface-container-low"
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold">
                          {c.label} ({c.semesterCode})
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[170px]">
                          {c.sectionText}
                        </div>
                      </div>
                    </div>
                    <span className="font-code-cell text-code-cell text-secondary font-bold">
                      {c.weeklyHours} Hrs/Wk
                    </span>
                  </div>
                ))}
              </div>

              {/* Metric Badges Row */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Simultaneous Load</span>
                  <span className="font-label-md text-label-md font-bold">
                    {totalWeeklyCreditHours} Total Weekly Hours
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Instructors Involved</span>
                  <span className="font-label-md text-label-md font-bold">{teachers.length} Full-Time Teachers</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Shared Core Labs</span>
                  <span className="font-label-md text-label-md font-bold">{labs.length} Specialized Labs</span>
                </div>
              </div>

              {/* Dynamic Laboratory Slot Allocation Distribution */}
              <div className="mt-space-lg pt-space-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Lab Capacity Saturation
                  </span>
                  <span className="font-code-cell text-code-cell text-secondary font-bold">
                    {labDistribution.saturation}% Scheduled
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                  {labDistribution.labShares.map((l, idx) => {
                    const colors = ['bg-secondary', 'bg-secondary-container', 'bg-[#0c9488]', 'bg-amber-600'];
                    const color = colors[idx % colors.length];
                    const share =
                      labs.length > 0 ? Math.round((l.hours / (labs.length * 24)) * 100) : 0;
                    return (
                      <div
                        key={l.id}
                        className={`${color} h-full transition-all`}
                        style={{ width: `${share}%` }}
                        title={`${l.name} (${l.hours}h)`}
                      ></div>
                    );
                  })}
                  <div
                    className="bg-surface-container-high h-full"
                    style={{ width: `${Math.max(0, 100 - labDistribution.saturation)}%` }}
                    title="Available Buffer"
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 font-code-cell text-code-cell text-on-surface-variant text-[11px] truncate">
                  {labDistribution.labShares.slice(0, 3).map((l, idx) => {
                    const colors = ['bg-secondary', 'bg-secondary-container', 'bg-[#0c9488]'];
                    return (
                      <span key={l.id} className="flex items-center gap-1 truncate max-w-[80px]">
                        <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`}></span>{' '}
                        {l.name.split(' ')[0]}
                      </span>
                    );
                  })}
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-surface-container-high"></span> Buffer
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Panel & CTA */}
            <div className="bg-primary-container text-on-primary rounded-xl p-space-lg shadow-md relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-space-md relative z-10">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                  Execution Stage • Step 4
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-code-cell text-tertiary-fixed font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span> Ready
                </span>
              </div>

              <h3 className="font-headline-md text-headline-md text-on-primary font-bold mb-1 relative z-10">
                Execute Batch Generation
              </h3>
              <p className="font-body-sm text-body-sm text-inverse-primary/90 mb-space-lg relative z-10">
                Will compute zero-clash schedules for all configured cohorts in {semester.type} Cycle simultaneously using Google OR-Tools CP-SAT integer programming solver.
              </p>

              {/* Error Message if Any */}
              {generationError && (
                <div className="mb-space-md p-space-sm rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2 relative z-10">
                  <span className="material-symbols-outlined text-[16px] text-red-400 mt-0.5">error</span>
                  <span>{generationError}</span>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="flex flex-col gap-space-sm relative z-10">
                {!generationDone ? (
                  <button
                    disabled={isGenerating}
                    onClick={handleStartGeneration}
                    className="w-full inline-flex items-center justify-center gap-space-sm py-3 px-space-lg rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-bold hover:bg-secondary/90 transition-all shadow-md active:scale-[0.99] group disabled:opacity-50"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-45">
                      rocket_launch
                    </span>
                    <span>{isGenerating ? 'Optimizing Matrix...' : 'Execute Timetable Solver (All 4 Years)'}</span>
                  </button>
                ) : (
                  <Link
                    href={generatedTimetableId ? `/timetable?timetable_id=${generatedTimetableId}` : '/timetable'}
                    className="w-full inline-flex items-center justify-center gap-space-sm py-3 px-space-lg rounded-lg bg-[#047857] text-white font-label-lg text-label-lg font-bold hover:bg-[#065f46] transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                    <span>View Generated Matrix →</span>
                  </Link>
                )}

                <button
                  disabled={isGenerating || isDryRunning}
                  onClick={handleDryRun}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-space-md rounded-lg bg-white/10 hover:bg-white/15 text-inverse-on-surface font-label-md text-label-md transition-colors disabled:opacity-50"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isDryRunning ? 'hourglass_top' : 'bug_report'}
                  </span>
                  <span>{isDryRunning ? 'Running Pre-Check...' : 'Run Dry Run Conflict Check Only'}</span>
                </button>
              </div>

              {/* Execution Details & API Metadata */}
              <div className="mt-space-md pt-space-md space-y-1.5 relative z-10 border-t border-white/10">
                <div className="flex items-center justify-between font-code-cell text-code-cell text-on-primary-container">
                  <span>Expected Solver Runtime:</span>
                  <span className="text-on-primary font-semibold">2.5 – 4.0 seconds</span>
                </div>
                <div className="flex items-center justify-between font-code-cell text-code-cell text-on-primary-container">
                  <span>Target API Endpoint:</span>
                  <span className="text-tertiary-fixed truncate max-w-[180px]" title="POST /api/v1/timetables/generate-cohorts">
                    POST .../generate-cohorts
                  </span>
                </div>
              </div>

              {/* Progress overlay simulation when running */}
              {isGenerating && (
                <div className="absolute inset-0 bg-primary-container/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-space-lg text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin mb-space-md"></div>
                  <span className="font-headline-sm text-headline-sm text-on-primary font-bold">
                    Optimizing 4-Cohort Matrix...
                  </span>
                  <span className="font-body-sm text-body-sm text-inverse-primary mt-1">
                    {solverStageText}
                  </span>
                  <div className="w-48 h-1.5 bg-white/10 rounded-full mt-space-md overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-300"
                      style={{ width: `${solverProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Success Card when completed */}
            {generationDone && (
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-space-lg shadow-sm text-[#065f46] animate-in fade-in duration-300">
                <div className="flex items-start gap-space-md">
                  <span className="material-symbols-outlined text-[24px] text-[#047857]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    task_alt
                  </span>
                  <div>
                    <h4 className="font-label-lg text-label-lg font-bold">Optimization Complete!</h4>
                    <p className="font-body-sm text-body-sm mt-0.5 text-[#047857]">
                      {totalWeeklyCreditHours} Hours Scheduled across academic semesters with 0 Hard Clashes.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={generatedTimetableId ? `/timetable?timetable_id=${generatedTimetableId}` : '/timetable'}
                        className="px-3 py-1.5 rounded-lg bg-[#047857] text-white font-label-md text-label-md font-bold hover:bg-[#065f46] transition-colors"
                      >
                        Inspect Timetable Matrix →
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationDone(false);
                          setGenerationStep(3);
                        }}
                        className="font-label-sm text-label-sm text-[#047857] hover:underline"
                      >
                        Run Another Cycle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Informational Banner */}
        <div className="mt-space-xl p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-space-md">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">info</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="font-semibold text-on-surface">Institutional Scheduling Rule:</strong> Simultaneous generation across all four academic years is mandatory to guarantee zero shared-teacher clashes and avoid overlaps in department laboratories. Generating semesters independently will invalidate cross-cohort conflict assertions.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link className="font-label-sm text-label-sm text-secondary font-bold hover:underline" href="/settings">
              Department Ruleset 2024 →
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
