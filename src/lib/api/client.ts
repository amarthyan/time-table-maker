import { timetableStore } from '../store/timetableStore';
import { AcademicClass, Lab, SemesterConfig, Subject, Teacher, TeacherAssignment } from '@/types/academic';
import { ConflictAlert, PublishStatus, TimetableEntry } from '@/types/timetable';

// Simulated delay helper for realistic network behavior
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const semesterApi = {
  get: async (): Promise<SemesterConfig> => {
    await delay();
    return timetableStore.getState().semester;
  },
  update: async (year: string, type: 'ODD' | 'EVEN') => {
    await delay();
    timetableStore.updateSemester(year, type);
    return timetableStore.getState().semester;
  },
};

export const classesApi = {
  list: async (): Promise<AcademicClass[]> => {
    await delay();
    return timetableStore.getState().classes;
  },
  create: async (data: { year: 1 | 2 | 3 | 4; name: string; studentCount: number }) => {
    await delay();
    return timetableStore.addClass(data.year, data.name, data.studentCount);
  },
  delete: async (id: string) => {
    await delay();
    timetableStore.deleteClass(id);
  },
};

export const subjectsApi = {
  list: async (): Promise<Subject[]> => {
    await delay();
    return timetableStore.getState().subjects;
  },
  create: async (subject: Omit<Subject, 'id'>) => {
    await delay();
    return timetableStore.addSubject(subject);
  },
  delete: async (id: string) => {
    await delay();
    timetableStore.deleteSubject(id);
  },
};

export const teachersApi = {
  list: async (): Promise<Teacher[]> => {
    await delay();
    const state = timetableStore.getState();
    return state.teachers.map((t) => ({
      ...t,
      assignedSubjectCount: state.assignments.filter((a) => a.teacherId === t.id).length,
    }));
  },
  create: async (teacher: Omit<Teacher, 'id' | 'assignedSubjectCount'>) => {
    await delay();
    return timetableStore.addTeacher(teacher);
  },
  delete: async (id: string) => {
    await delay();
    timetableStore.deleteTeacher(id);
  },
};

export const assignmentsApi = {
  list: async (): Promise<TeacherAssignment[]> => {
    await delay();
    return timetableStore.getState().assignments;
  },
  assign: async (teacherId: string, subjectId: string, classId: string) => {
    await delay();
    timetableStore.assignTeacher(teacherId, subjectId, classId);
  },
  unassign: async (id: string) => {
    await delay();
    timetableStore.unassignTeacher(id);
  },
};

export const labsApi = {
  list: async (): Promise<Lab[]> => {
    await delay();
    return timetableStore.getState().labs;
  },
  create: async (lab: Omit<Lab, 'id'>) => {
    await delay();
    return timetableStore.addLab(lab);
  },
  update: async (id: string, updates: Partial<Lab>) => {
    await delay();
    timetableStore.updateLab(id, updates);
  },
  delete: async (id: string) => {
    await delay();
    timetableStore.deleteLab(id);
  },
};

export const timetableApi = {
  get: async (classId?: string): Promise<TimetableEntry[]> => {
    await delay();
    const entries = timetableStore.getState().timetable;
    if (classId) {
      return entries.filter((e) => e.classId === classId);
    }
    return entries;
  },
  generate: async (simulateConflict = false): Promise<{ success: boolean; conflicts: ConflictAlert[] }> => {
    await delay(600); // realistic generation time
    return timetableStore.generateAllTimetables(simulateConflict);
  },
  updateEntry: async (id: string, updates: Partial<TimetableEntry>) => {
    await delay();
    timetableStore.updateTimetableEntry(id, updates);
  },
  publish: async (status: PublishStatus) => {
    await delay();
    timetableStore.setPublishStatus(status);
  },
};
