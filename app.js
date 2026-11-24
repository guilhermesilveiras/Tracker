import { TERMS, ELECTIVES } from './catalog.js';
import {
  freshProgress, parseSnapshot, serializeSnapshot, selectStatus,
  setActivityHours, summarize, STATUSES, STATUS_LABELS,
} from './core.js';

const STORE_KEY = 'tracker.progress.v1';
const THEME_KEY = 'tracker.theme';
const $ = id => document.getElementById(id);
let state = freshProgress();

function notify(message) {
  const toast = $('notification');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function save() {
  try { localStorage.setItem(STORE_KEY, serializeSnapshot(state)); }
  catch { notify('Local storage is unavailable. Export your progress instead.'); }
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = parseSnapshot(raw);
  } catch {
    state = freshProgress();
    notify('Saved data was invalid or inaccessible. A fresh sample was loaded.');
  }
}

function textNode(tag, content, className) {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
}

function selectElement(id, category) {
  const el = document.createElement('select');
  el.className = 'status-select';
  el.setAttribute('aria-label', `Status of ${id}`);
  for (const status of STATUSES) {
    const option = new Option(STATUS_LABELS[status], status);
    el.add(option);
  }
  el.value = state[category][id] ?? 'not-started';
  el.addEventListener('change', event => {
    try {
      state = selectStatus(state, id, event.target.value, category);
      save();
      render();
    } catch (error) { notify(error.message); render(); }
  });
  return el;
}

function drawTerm(term) {
  const card = document.createElement('article');
  card.className = 'term-card';
  const head = document.createElement('div');
  head.className = 'term-head';
  const heading = document.createElement('div');
  heading.append(textNode('span', `TERM ${String(term.number).padStart(2, '0')}`, 'term-index'));
  heading.append(textNode('h3', term.title));
  head.append(heading);
  const completed = term.courses.filter(c => state.courses[c.id] === 'completed').length;
  const options = new Set(term.courses.filter(c => c.optionGroup).map(c => c.optionGroup));
  const achievable = term.courses.length - options.size;
  head.append(textNode('span', `${completed} / ${achievable} completed`, 'term-count'));
  card.append(head);
  for (const course of term.courses) {
    const row = document.createElement('div');
    row.className = 'course-row';
    const copy = document.createElement('div');
    copy.className = 'course-copy';
    copy.append(textNode('span', course.name, 'course-title'));
    copy.append(textNode('span', `${course.hours} h${course.optionGroup ? ' · alternative path' : ''}`, 'course-meta'));
    row.append(copy, selectElement(course.id, 'courses'));
    card.append(row);
  }
  return card;
}

function drawElective(course) {
  const card = document.createElement('article');
  card.className = 'elective-card';
  card.append(textNode('span', `${course.hours} SAMPLE HOURS`, 'term-index'));
  card.append(textNode('h3', course.name));
  card.append(selectElement(course.id, 'electives'));
  return card;
}

function setBar(id, value, total) {
  $(id).style.width = `${Math.min(100, Math.max(0, (value / total) * 100))}%`;
}

function render() {
  const result = summarize(state);
  $('pct').textContent = `${result.percent}%`;
  $('progress-ring').setAttribute('aria-label', `${result.percent}% complete`);
  $('progress-ring').style.background = `conic-gradient(var(--accent) ${result.percent}%, var(--track) ${result.percent}% 100%)`;
  $('total-done').replaceChildren(document.createTextNode(`${result.earnedHours} `), textNode('span', `/ ${result.requiredHours} h`));
  $('core-value').textContent = `${result.core.done} / ${result.core.total} h`;
  $('elective-value').textContent = `${result.electives.done} / ${result.electives.total} h`;
  $('activities-value').textContent = `${result.activities.done} / ${result.activities.total} h`;
  setBar('core-track', result.core.done, result.core.total);
  setBar('elective-track', result.electives.done, result.electives.total);
  setBar('activities-track', result.activities.done, result.activities.total);
  $('activity-hours').value = state.activity_hours;
  $('terms').replaceChildren(...TERMS.map(drawTerm));
  $('elective-cards').replaceChildren(...ELECTIVES.map(drawElective));
}

$('save-activities').addEventListener('click', () => {
  const raw = $('activity-hours').value;
  if (raw.trim() === '') return notify('Please enter a valid number of hours.');
  try {
    state = setActivityHours(state, Number(raw));
    save(); render(); notify('Sample activity hours updated.');
  } catch (error) { notify(error.message); }
});

$('export').addEventListener('click', () => {
  const blob = new Blob([serializeSnapshot(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tracker-backup.json';
  link.click();
  URL.revokeObjectURL(url);
  notify('Local anonymous backup exported.');
});

$('import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 150000) throw new Error('File is too large. Only small JSON backups are supported.');
    const parsed = parseSnapshot(await file.text());
    if (!window.confirm('Replace the current anonymous demo progress with this backup?')) return;
    state = parsed; save(); render(); notify('Backup imported locally.');
  } catch (error) { notify(error.message); }
  finally { event.target.value = ''; }
});

$('reset').addEventListener('click', () => {
  if (!window.confirm('Reset all locally stored sample progress?')) return;
  state = freshProgress(); save(); render(); notify('Sample data reset.');
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  $('theme-button').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
}
try { applyTheme(localStorage.getItem(THEME_KEY) || 'light'); }
catch { applyTheme('light'); }
$('theme-button').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* optional setting */ }
});

function activateNav() {
  const current = location.hash.slice(1) || 'overview';
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === current);
  });
}
window.addEventListener('hashchange', activateNav);
load(); render(); activateNav();
