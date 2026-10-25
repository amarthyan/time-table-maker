'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Mail,
  BadgeCheck,
  Users,
  ArrowRight,
  BookOpen,
  Search,
  Sparkles,
} from 'lucide-react';
import { useTimetableStore } from '@/lib/store/useTimetableStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function TeachersPage() {
  const { teachers, assignments, addTeacher, deleteTeacher } = useTimetableStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTeacher({
      name: name.trim(),
      employeeId: employeeId.trim() || `EMP-${Date.now().toString().slice(-4)}`,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
    });

    setIsAddModalOpen(false);
    setName('');
    setEmployeeId('');
    setEmail('');
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Step 4 of 7
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Faculty Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Teacher Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Maintain the department teaching faculty and monitor workload distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="font-bold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Faculty
            </Button>
            <Link href="/assignments">
              <Button variant="outline" className="font-bold text-xs h-9">
                Next: Teaching Matrix <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Total Faculty: </span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {teachers.length} Professors
            </span>
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {searchTerm ? 'No faculty matches your search' : 'No Faculty Members Registered'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Try searching with another name or employee ID.'
                : 'Add department teaching faculty to assign subjects and generate workload schedules.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddModalOpen(true)} className="font-bold text-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Faculty Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => {
              const assignedCount = assignments.filter((a) => a.teacherId === teacher.id).length;

              return (
                <Card
                  key={teacher.id}
                  className="hover:border-indigo-300 hover:shadow-md transition-all border-slate-200/90 bg-white shadow-2xs rounded-2xl"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                          {teacher.name.charAt(0)}
                        </div>
                        <Badge
                          variant={assignedCount > 0 ? 'purple' : 'default'}
                          className="text-[11px] font-semibold py-0.5 px-2.5"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {assignedCount} Assigned Section{assignedCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">{teacher.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-mono">{teacher.employeeId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{teacher.email}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Department of CSE</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remove faculty member ${teacher.name}?`)) {
                            deleteTeacher(teacher.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
                        title="Delete faculty record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Teacher Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register Faculty Member"
          description="Add a new professor or lecturer to the department directory."
        >
          <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
            <Input
              label="Full Name & Title"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Employee ID (Auto-generated if empty)"
              placeholder="e.g. FAC-1001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
            <Input
              label="Official Email Address"
              type="email"
              placeholder="e.g. faculty@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold">
                Register Faculty
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
