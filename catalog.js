/**
 * FICTITIOUS curriculum created for the HFI sandbox.
 * These records do not represent UFRPE or any real institution.
 */
export const TERMS = [
  { number: 1, title: 'Foundations', courses: [
    { id: 'c101', name: 'Programming Foundations', hours: 60 },
    { id: 'c102', name: 'Discrete Reasoning', hours: 60 },
    { id: 'c103', name: 'Systems Thinking', hours: 45 },
    { id: 'c104', name: 'Computing Workshop', hours: 45 },
  ] },
  { number: 2, title: 'Building Blocks', courses: [
    { id: 'c201', name: 'Object-Oriented Programming', hours: 60 },
    { id: 'c202', name: 'Data Structures', hours: 60 },
    { id: 'c203', name: 'Introduction to Databases', hours: 60 },
    { id: 'c204', name: 'Product Design Fundamentals', hours: 45 },
  ] },
  { number: 3, title: 'Applied Development', courses: [
    { id: 'c301', name: 'Web Application Development', hours: 60 },
    { id: 'c302', name: 'Operating Systems', hours: 60 },
    { id: 'c303', name: 'Data Modeling', hours: 45 },
    { id: 'c304', name: 'Software Testing', hours: 45 },
  ] },
  { number: 4, title: 'Engineering Practice', courses: [
    { id: 'c401', name: 'Software Architecture', hours: 60 },
    { id: 'c402', name: 'Computer Networks', hours: 60 },
    { id: 'c403', name: 'API Design', hours: 45 },
    { id: 'c404', name: 'User Experience Methods', hours: 45 },
  ] },
  { number: 5, title: 'Systems Integration', courses: [
    { id: 'c501', name: 'Distributed Applications', hours: 60 },
    { id: 'c502', name: 'Data Engineering Fundamentals', hours: 60 },
    { id: 'c503', name: 'Information Security', hours: 45 },
    { id: 'c504', name: 'Technical Project Management', hours: 45 },
  ] },
  { number: 6, title: 'Professional Practice', courses: [
    { id: 'c601', name: 'Cloud-Based Systems', hours: 60 },
    { id: 'c602', name: 'Software Quality', hours: 45 },
    { id: 'c603', name: 'Applied Analytics', hours: 45 },
    { id: 'c604', name: 'Systems Capstone Studio', hours: 60 },
  ] },
  { number: 7, title: 'Project Studio I', courses: [
    { id: 'c701', name: 'Project Delivery Methods', hours: 45 },
    { id: 'c702', name: 'Technical Communication', hours: 45 },
    { id: 'c703a', name: 'Community Project I', hours: 60, optionGroup: 'project7' },
    { id: 'c703b', name: 'Complex Solutions Project I', hours: 60, optionGroup: 'project7' },
  ] },
  { number: 8, title: 'Project Studio II', courses: [
    { id: 'c801', name: 'Applied Research Methods', hours: 45 },
    { id: 'c802', name: 'Final Portfolio', hours: 90 },
    { id: 'c803a', name: 'Community Project II', hours: 60, optionGroup: 'project8' },
    { id: 'c803b', name: 'Complex Solutions Project II', hours: 60, optionGroup: 'project8' },
  ] },
];

export const ELECTIVES = [
  { id: 'e101', name: 'Practical Algorithms', hours: 45 },
  { id: 'e102', name: 'Human-Centered Interfaces', hours: 45 },
  { id: 'e103', name: 'Advanced Python Practices', hours: 45 },
  { id: 'e104', name: 'Testing Automation', hours: 45 },
  { id: 'e105', name: 'Open Data and Visualization', hours: 45 },
  { id: 'e106', name: 'Developer Tooling', hours: 45 },
];

export const TARGETS = Object.freeze({ elective: 135, activities: 180 });

export const COURSE_LIST = TERMS.flatMap(term => term.courses);
export const COURSE_IDS = new Set(COURSE_LIST.map(course => course.id));
export const ELECTIVE_IDS = new Set(ELECTIVES.map(course => course.id));

// A choice group contributes once to the required core total.
const regular = COURSE_LIST.filter(course => !course.optionGroup);
const groups = new Map();
COURSE_LIST.filter(course => course.optionGroup).forEach(course => groups.set(course.optionGroup, course.hours));
export const CORE_TARGET = regular.reduce((sum, course) => sum + course.hours, 0)
  + [...groups.values()].reduce((sum, hours) => sum + hours, 0);
