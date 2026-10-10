// Copy for the landing page. Every claim here describes what Noto actually does.
// Each screen in both themes; the page shows the one matching the current theme.
import dashboardDay from '../../assets/landing/dashboard-light.webp';
import dashboardNight from '../../assets/landing/dashboard-dark.webp';
import assignmentsDay from '../../assets/landing/assignments-light.webp';
import assignmentsNight from '../../assets/landing/assignments-dark.webp';
import notesDay from '../../assets/landing/notes-light.webp';
import notesNight from '../../assets/landing/notes-dark.webp';
import subjectsDay from '../../assets/landing/subjects-light.webp';
import subjectsNight from '../../assets/landing/subjects-dark.webp';

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#aws', label: 'Under the hood' },
];

export const INTRO_STATEMENT =
  'We built Noto for anyone with five subjects, too many PDFs and a deadline they half remember: one place for every assignment, every note and whatever is due next.';

export const FEATURES = [
  {
    icon: 'assignments',
    title: 'Assignments',
    body: 'A title, a subject, a due date and a priority. Mark it complete when it is done.',
  },
  {
    icon: 'clock',
    title: 'Deadlines',
    body: 'Due today, due tomorrow, overdue by a day. The most urgent one is always first.',
  },
  {
    icon: 'notes',
    title: 'Notes & files',
    body: 'Lecture notes, slides, PDFs and photos up to 10 MB, stored privately for your account.',
  },
  {
    icon: 'subjects',
    title: 'Subjects',
    body: 'File everything by subject. Each subject gets its own colour.',
  },
  {
    icon: 'dashboard',
    title: 'Dashboard',
    body: 'Total, pending, completed and overdue work, what is due next and what you uploaded last.',
  },
];

export const STEPS = [
  {
    title: 'Sign up',
    body: 'Create an account with your email. Cognito sends a six-digit code; enter it and you are in.',
    diagram: 'code',
  },
  {
    title: 'Add subjects',
    body: 'DBMS, Operating Systems, AI. Each subject gets a colour that follows it everywhere.',
    diagram: 'tags',
  },
  {
    title: 'Track work',
    body: 'Add the brief, the due date and a priority. Noto counts down and puts the most urgent first.',
    diagram: 'check',
  },
  {
    title: 'Keep notes',
    body: 'Upload PDFs, slides and photos. They go straight to private storage, and only you can open them.',
    diagram: 'upload',
  },
];

export const STACK = [
  {
    icon: 'lock',
    title: 'Sign-in, handled',
    service: 'Amazon Cognito',
    body: 'Sign-up, the emailed code and sign-in. Your password goes to Cognito and nowhere else.',
  },
  {
    icon: 'bolt',
    title: 'Logic on demand',
    service: 'API Gateway + Lambda',
    body: 'Every request is checked for a valid token, then three small functions do the work and stop.',
  },
  {
    icon: 'database',
    title: 'Data and files',
    service: 'DynamoDB + S3',
    body: 'Assignments live under your user ID; the files themselves sit in a private bucket.',
  },
  {
    icon: 'activity',
    title: 'Served and watched',
    service: 'Amplify + CloudWatch',
    body: 'This site is served over HTTPS; logs and error alarms keep an eye on the rest.',
  },
];

export const SCREENS = [
  {
    icon: 'dashboard',
    title: 'Dashboard',
    tags: ['Overview', 'Next up'],
    image: { day: dashboardDay, night: dashboardNight },
    alt: 'The Noto dashboard with assignment totals, a completion line and the next deadline',
    does: 'Counts your total, pending, completed and overdue assignments, shows how much is done, and puts the most urgent pending assignment in a card with a button to finish it. Upcoming deadlines and your latest uploads sit underneath.',
    helps: 'You open Noto and know in one look what needs doing tonight.',
  },
  {
    icon: 'assignments',
    title: 'Assignments',
    tags: ['Deadlines', 'Priority'],
    image: { day: assignmentsDay, night: assignmentsNight },
    alt: 'The assignments page with search, filters and assignment cards',
    does: 'Create an assignment with a title, subject, due date, priority and description. Search, filter by subject or status, sort by due date, edit, delete, and toggle complete.',
    helps: 'Nothing lives only in the group chat any more, and nothing sneaks past its due date.',
  },
  {
    icon: 'notes',
    title: 'Notes',
    tags: ['Files', 'Up to 10 MB'],
    image: { day: notesDay, night: notesNight },
    alt: 'The notes page with uploaded files filed by subject',
    does: 'Upload PDF, Word, PowerPoint, text and image files up to 10 MB each, filed by subject. Your browser sends them straight to a private S3 bucket with a short-lived signed link.',
    helps: 'The slides you need are next to the assignment they are for, on any device.',
  },
  {
    icon: 'subjects',
    title: 'Subjects',
    tags: ['Colours', 'Organise'],
    image: { day: subjectsDay, night: subjectsNight },
    alt: 'The subjects page with a coloured card per subject',
    does: 'Add the subjects you take this semester. Each gets a colour that marks its assignments and files, and a subject cannot be deleted while work still uses it.',
    helps: 'DBMS never gets lost between Operating Systems and AI.',
  },
];
