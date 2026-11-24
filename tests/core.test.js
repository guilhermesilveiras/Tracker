import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_LIST, CORE_TARGET, ELECTIVES, TARGETS } from '../catalog.js';
import { freshProgress, parseSnapshot, selectStatus, serializeSnapshot, setActivityHours, summarize } from '../core.js';

test('zero sample progress by default', () => {
  const p = summarize(freshProgress());
  assert.equal(p.earnedHours, 0);
  assert.equal(p.percent, 0);
  assert.equal(p.requiredHours, CORE_TARGET + TARGETS.elective + TARGETS.activities);
});

test('only completed status adds credit', () => {
  let p = freshProgress();
  p = selectStatus(p, 'c101', 'planned');
  p = selectStatus(p, 'c102', 'in-progress');
  assert.equal(summarize(p).core.done, 0);
  p = selectStatus(p, 'c101', 'completed');
  assert.equal(summarize(p).core.done, 60);
});

test('two project alternatives cannot count together', () => {
  let p = selectStatus(freshProgress(), 'c703a', 'completed');
  p = selectStatus(p, 'c703b', 'completed');
  assert.equal(p.courses.c703a, undefined);
  assert.equal(p.courses.c703b, 'completed');
  assert.equal(summarize(p).core.done, 60);
});

test('alternatives are never double-counted in the core requirement', () => {
  const groups = new Map();
  const regularHours = COURSE_LIST.filter(c => !c.optionGroup).reduce((n,c) => n + c.hours,0);
  COURSE_LIST.filter(c => c.optionGroup).forEach(c => groups.set(c.optionGroup,c.hours));
  assert.equal(CORE_TARGET, regularHours + [...groups.values()].reduce((a,b)=>a+b,0));
});

test('electives cap at target even if extra courses completed', () => {
  let p = freshProgress();
  for (const e of ELECTIVES) p = selectStatus(p, e.id, 'completed', 'electives');
  assert.equal(summarize(p).electives.actual, 270);
  assert.equal(summarize(p).electives.done, TARGETS.elective);
});

test('activity hours cap at target', () => {
  let p = setActivityHours(freshProgress(), 280);
  assert.equal(summarize(p).activities.done, TARGETS.activities);
});

test('backup round-trip preserves supported anonymous data', () => {
  let p = selectStatus(freshProgress(), 'c301', 'completed');
  p = setActivityHours(p, 37.5);
  assert.deepEqual(parseSnapshot(serializeSnapshot(p)), p);
});

test('reject unknown fields to avoid accidental personal record import', () => {
  const value = { ...freshProgress(), student_name: 'test name' };
  assert.throws(() => parseSnapshot(JSON.stringify(value)), /Unexpected fields/);
});

test('reject unknown identifiers and malformed status', () => {
  const value = freshProgress();
  value.courses.hidden = 'completed';
  assert.throws(() => parseSnapshot(JSON.stringify(value)), /Invalid course/);
  assert.throws(() => selectStatus(freshProgress(), 'c101', 'INVALID'), /Unknown/);
});

test('reject conflicted project imports', () => {
  const value = freshProgress();
  value.courses = { c703a: 'completed', c703b: 'completed' };
  assert.throws(() => parseSnapshot(JSON.stringify(value)), /Conflicting/);
});

test('reject negative, non-numeric and excessive values', () => {
  assert.throws(() => setActivityHours(freshProgress(), -1));
  assert.throws(() => setActivityHours(freshProgress(), Infinity));
  assert.throws(() => setActivityHours(freshProgress(), 10001));
});
