'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sliders, Clock, Calendar, Check, ArrowRight } from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DAYS_OF_WEEK } from '@/lib/constants/academic';

export default function SettingsPage() {
  const { settings, updateSettings } = useTimetableStore();
  const [workingDays, setWorkingDays] = useState<number[]>(settings.workingDays);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const toggleDay = (dayId: number) => {
    if (workingDays.includes(dayId)) {
      if (workingDays.length <= 1) return; // At least one working day required
      setWorkingDays(workingDays.filter((d) => d !== dayId));
    } else {
      setWorkingDays([...workingDays, dayId].sort());
    }
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      workingDays,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="purple" className="mb-2">
              Step 7 of 8: Schedule Settings
            </Badge>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timetable Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Set departmental working days and standard period duration schedules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/generate">
              <Button className="font-semibold shadow-xs">
                Proceed to Generate <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {savedFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="h-4 w-4 text-emerald-600" />
            Timetable settings updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Days */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-indigo-600">
                <Calendar className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-slate-900">Department Working Days</CardTitle>
              </div>
              <CardDescription>Select which days of the week academic periods are scheduled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = workingDays.includes(day.id);

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>{day.name}</span>
                    <Badge variant={isSelected ? 'purple' : 'default'} className="text-xs">
                      {isSelected ? 'Active' : 'Off'}
                    </Badge>
                  </button>
                );
              })}

              <div className="pt-2">
                <Button onClick={handleSave} className="w-full font-bold">
                  Save Working Days
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Period Structure */}
          <Card className="bg-slate-50/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-indigo-600">
                <Clock className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-slate-900">Standard Period Timings</CardTitle>
              </div>
              <CardDescription>Daily period breakdown and break intervals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {settings.periods.map((period, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    period.isBreak
                      ? 'border-amber-200 bg-amber-50/70 text-amber-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-800 font-medium shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{period.name}</span>
                    {period.isBreak && <Badge variant="warning">Interval</Badge>}
                  </div>
                  <div className="font-mono text-slate-600">
                    {period.startTime} – {period.endTime}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
