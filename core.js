import { COURSE_IDS, COURSE_LIST, ELECTIVES, ELECTIVE_IDS, TARGETS, CORE_TARGET } from './catalog.js';

export const STATUSES = Object.freeze(['not-started', 'planned', 'in-progress', 'completed']);
export const STATUS_LABELS = Object.freeze({
  'not-started': 'Not started',
  'planned': 'Planned',
  'in-progress': 'In progress',
  'completed': 'Completed',
});
export const STORAGE_VERSION = 1;

export function freshProgress() {
  return { schema_version: STORAGE_VERSION, courses: {}, electives: {}, activity_hours: 0 };
}

export function selectStatus(state, courseId, status, category = 'courses') {
  const allowedIds = category === 'courses' ? COURSE_IDS : ELECTIVE_IDS;
  if (!allowedIds.has(courseId) || !STATUSES.includes(status)) {
    throw new Error('Unknown course or status.');
  }
  const copy = structuredClone(state);
  const target = copy[category];
  if (status === 'not-started') delete target[courseId];
  else target[courseId] = status;

  if (category === 'courses' && status !== 'not-started') {
    const selected = COURSE_LIST.find(course => course.id === courseId);
    if (selected.optionGroup) {
      COURSE_LIST.filter(other => other.optionGroup === selected.optionGroup && other.id !== courseId)
        .forEach(other => delete target[other.id]);
    }
  }
  return copy;
}

export function setActivityHours(state, hours) {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0 || hours > 10000) {
    throw new Error('Hours must be a number between 0 and 10000.');
  }
  return { ...state, activity_hours: Math.round(hours * 10) / 10 };
}

export function summarize(state) {
  const completedCore = COURSE_LIST.filter(c => state.courses[c.id] === 'completed')
    .reduce((sum, c) => sum + c.hours, 0);
  const completedElectives = ELECTIVES.filter(c => state.electives[c.id] === 'completed')
    .reduce((sum, c) => sum + c.hours, 0);
  const cappedElectives = Math.min(TARGETS.elective, completedElectives);
  const cappedActivities = Math.min(TARGETS.activities, state.activity_hours);
  const requiredHours = CORE_TARGET + TARGETS.elective + TARGETS.activities;
  const earnedHours = completedCore + cappedElectives + cappedActivities;
  return {
    core: { done: completedCore, total: CORE_TARGET },
    electives: { done: cappedElectives, actual: completedElectives, total: TARGETS.elective },
    activities: { done: cappedActivities, actual: state.activity_hours, total: TARGETS.activities },
    earnedHours,
    requiredHours,
    percent: Math.min(100, Math.round((earnedHours / requiredHours) * 100)),
    completedCourses: COURSE_LIST.filter(c => state.courses[c.id] === 'completed').length,
  };
}

function objectMap(value, allowedSet) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid course map.');
  }
  const result = {};
  for (const [id, status] of Object.entries(value)) {
    if (!allowedSet.has(id) || !STATUSES.includes(status)) {
      throw new Error(`Invalid course or status: ${id}`);
    }
    if (status !== 'not-started') result[id] = status;
  }
  return result;
}

export function parseSnapshot(raw) {
  if (typeof raw !== 'string' || raw.length > 150000) throw new Error('Invalid or oversized backup.');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid backup.');
  const keys = Object.keys(parsed);
  if (keys.some(key => !['schema_version', 'courses', 'electives', 'activity_hours'].includes(key))) {
    throw new Error('Unexpected fields: only anonymous study progress is supported.');
  }
  if (parsed.schema_version !== STORAGE_VERSION) throw new Error('Unsupported backup version.');
  const courses = objectMap(parsed.courses, COURSE_IDS);
  const electives = objectMap(parsed.electives, ELECTIVE_IDS);
  const usedGroups = new Set();
  for (const course of COURSE_LIST) {
    if (course.optionGroup && courses[course.id]) {
      if (usedGroups.has(course.optionGroup)) throw new Error('Conflicting project alternatives.');
      usedGroups.add(course.optionGroup);
    }
  }
  const n = parsed.activity_hours;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 10000) {
    throw new Error('Invalid activity hours.');
  }
  return { schema_version: STORAGE_VERSION, courses, electives, activity_hours: n };
}

export function serializeSnapshot(state) {
  return JSON.stringify(parseSnapshot(JSON.stringify(state)), null, 2);
}
