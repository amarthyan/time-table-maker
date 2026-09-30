/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academic_years from "../academic_years.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as classes from "../classes.js";
import type * as departments from "../departments.js";
import type * as labs from "../labs.js";
import type * as rooms from "../rooms.js";
import type * as semesters from "../semesters.js";
import type * as subjects from "../subjects.js";
import type * as teachers from "../teachers.js";
import type * as time_slots from "../time_slots.js";
import type * as timetables from "../timetables.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academic_years: typeof academic_years;
  assignments: typeof assignments;
  auth: typeof auth;
  classes: typeof classes;
  departments: typeof departments;
  labs: typeof labs;
  rooms: typeof rooms;
  semesters: typeof semesters;
  subjects: typeof subjects;
  teachers: typeof teachers;
  time_slots: typeof time_slots;
  timetables: typeof timetables;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
