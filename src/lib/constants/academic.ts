import { Lab, PeriodSlot, SemesterConfig, TimetableSettings } from "@/types/academic";

export const SEMESTER_CYCLES = {
  ODD: [
    { year: 1, semesterNumber: 1, semesterCode: 'S1', label: '1st Year' },
    { year: 2, semesterNumber: 3, semesterCode: 'S3', label: '2nd Year' },
    { year: 3, semesterNumber: 5, semesterCode: 'S5', label: '3rd Year' },
    { year: 4, semesterNumber: 7, semesterCode: 'S7', label: '4th Year' },
  ],
  EVEN: [
    { year: 1, semesterNumber: 2, semesterCode: 'S2', label: '1st Year' },
    { year: 2, semesterNumber: 4, semesterCode: 'S4', label: '2nd Year' },
    { year: 3, semesterNumber: 6, semesterCode: 'S6', label: '3rd Year' },
    { year: 4, semesterNumber: 8, semesterCode: 'S8', label: '4th Year' },
  ],
} as const;

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export const DEFAULT_PERIODS: PeriodSlot[] = [
  { periodNumber: 1, name: 'Period 1', startTime: '09:00', endTime: '10:00' },
  { periodNumber: 2, name: 'Period 2', startTime: '10:00', endTime: '11:00' },
  { periodNumber: 0, name: 'Morning Break', startTime: '11:00', endTime: '11:15', isBreak: true },
  { periodNumber: 3, name: 'Period 3', startTime: '11:15', endTime: '12:15' },
  { periodNumber: 0, name: 'Lunch Break', startTime: '12:15', endTime: '01:00', isBreak: true },
  { periodNumber: 4, name: 'Period 4', startTime: '01:00', endTime: '02:00' },
  { periodNumber: 5, name: 'Period 5', startTime: '02:00', endTime: '03:00' },
  { periodNumber: 6, name: 'Period 6', startTime: '03:00', endTime: '04:00' },
];

export const DEFAULT_LABS: Lab[] = [];

export const DEFAULT_SEMESTER: SemesterConfig = {
  id: 'sem-2026-odd',
  academicYear: '2026–27',
  type: 'ODD',
  isActive: true,
};

export const DEFAULT_SETTINGS: TimetableSettings = {
  workingDays: [1, 2, 3, 4, 5, 6],
  periods: DEFAULT_PERIODS,
};
