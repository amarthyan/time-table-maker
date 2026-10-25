'use client';

import { useSyncExternalStore } from 'react';
import { timetableStore, AppState } from './timetableStore';

export function useTimetableStore(): AppState & {
  updateSemester: typeof timetableStore.updateSemester;
  addClass: typeof timetableStore.addClass;
  deleteClass: typeof timetableStore.deleteClass;
  addSubject: typeof timetableStore.addSubject;
  updateSubject: typeof timetableStore.updateSubject;
  deleteSubject: typeof timetableStore.deleteSubject;
  addTeacher: typeof timetableStore.addTeacher;
  deleteTeacher: typeof timetableStore.deleteTeacher;
  assignTeacher: typeof timetableStore.assignTeacher;
  unassignTeacher: typeof timetableStore.unassignTeacher;
  addLab: typeof timetableStore.addLab;
  updateLab: typeof timetableStore.updateLab;
  deleteLab: typeof timetableStore.deleteLab;
  updateSettings: typeof timetableStore.updateSettings;
  generateAllTimetables: typeof timetableStore.generateAllTimetables;
  updateTimetableEntry: typeof timetableStore.updateTimetableEntry;
  setPublishStatus: typeof timetableStore.setPublishStatus;
  resolveConflict: typeof timetableStore.resolveConflict;
  resetToDefault: typeof timetableStore.resetToDefault;
} {
  const state = useSyncExternalStore(
    (onStoreChange) => timetableStore.subscribe(onStoreChange),
    () => timetableStore.getState(),
    () => timetableStore.getState()
  );

  return {
    ...state,
    updateSemester: timetableStore.updateSemester.bind(timetableStore),
    addClass: timetableStore.addClass.bind(timetableStore),
    deleteClass: timetableStore.deleteClass.bind(timetableStore),
    addSubject: timetableStore.addSubject.bind(timetableStore),
    updateSubject: timetableStore.updateSubject.bind(timetableStore),
    deleteSubject: timetableStore.deleteSubject.bind(timetableStore),
    addTeacher: timetableStore.addTeacher.bind(timetableStore),
    deleteTeacher: timetableStore.deleteTeacher.bind(timetableStore),
    assignTeacher: timetableStore.assignTeacher.bind(timetableStore),
    unassignTeacher: timetableStore.unassignTeacher.bind(timetableStore),
    addLab: timetableStore.addLab.bind(timetableStore),
    updateLab: timetableStore.updateLab.bind(timetableStore),
    deleteLab: timetableStore.deleteLab.bind(timetableStore),
    updateSettings: timetableStore.updateSettings.bind(timetableStore),
    generateAllTimetables: timetableStore.generateAllTimetables.bind(timetableStore),
    updateTimetableEntry: timetableStore.updateTimetableEntry.bind(timetableStore),
    setPublishStatus: timetableStore.setPublishStatus.bind(timetableStore),
    resolveConflict: timetableStore.resolveConflict.bind(timetableStore),
    resetToDefault: timetableStore.resetToDefault.bind(timetableStore),
  };
}
