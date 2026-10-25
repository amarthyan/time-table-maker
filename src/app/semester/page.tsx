'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SEMESTER_CYCLES } from '@/lib/constants/academic';

export default function SemesterPage() {
  const { semester, updateSemester } = useTimetableStore();
  const [academicYear, setAcademicYear] = useState(semester.academicYear);
  const [cycleType, setCycleType] = useState<'ODD' | 'EVEN'>(semester.type);
  const [savedMessage, setSavedMessage] = useState(false);

  const mappings = SEMESTER_CYCLES[cycleType];

  const handleSave = () => {
    updateSemester(academicYear, cycleType);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Badge variant="purple" className="mb-2">
            Step 1 of 8: Semester Configuration
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Year & Semester Cycle</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define the active academic period. The system automatically computes the 4-year semester mappings (S1–S8)
            so you never have to map them manually.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Semester configuration saved successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Select Active Cycle</CardTitle>
              <CardDescription>Choose the academic year and current semester session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value="2025–26">2025–26</option>
                  <option value="2026–27">2026–27</option>
                  <option value="2027–28">2027–28</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Semester Cycle</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCycleType('ODD')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      cycleType === 'ODD'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">Odd Semester</div>
                    <div className="text-xs text-slate-500 mt-1">S1, S3, S5, S7</div>
                    <div className="text-[11px] text-indigo-600 font-semibold mt-2">Typically July – Dec</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycleType('EVEN')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      cycleType === 'EVEN'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">Even Semester</div>
                    <div className="text-xs text-slate-500 mt-1">S2, S4, S6, S8</div>
                    <div className="text-[11px] text-indigo-600 font-semibold mt-2">Typically Jan – June</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button onClick={handleSave} className="w-full sm:w-auto font-bold">
                  Save Changes
                </Button>
                <Link href="/classes">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold">
                    Next: Classes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Automatic 4-Year Mapping Preview */}
          <Card className="bg-slate-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Computed Mappings</CardTitle>
                <Badge variant="purple">{cycleType} Cycle</Badge>
              </div>
              <CardDescription>
                System-derived mapping across all four academic years.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mappings.map((m) => (
                  <div
                    key={m.year}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        Y{m.year}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{m.label}</div>
                        <div className="text-[11px] text-slate-400">Class Year {m.year}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Semester</span>
                      <Badge variant="info" className="font-mono text-xs font-bold px-2.5 py-0.5">
                        {m.semesterCode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-indigo-900 text-xs">
                <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  All classes, subjects, and timetables added in subsequent steps will bind to these four semester
                  targets automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
