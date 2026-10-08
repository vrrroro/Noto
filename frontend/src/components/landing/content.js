// Copy for the landing page. Every claim here describes what Noto actually does.
import login from '../../assets/landing/login.webp';
import assignmentForm from '../../assets/landing/assignment-form.webp';
import dashboard from '../../assets/landing/dashboard.webp';
import assignments from '../../assets/landing/assignments.webp';
import notes from '../../assets/landing/notes.webp';
import phoneMenu from '../../assets/landing/phone-menu.webp';

// "Let's ___" in the header.
export const HEADER_WORDS = ['plan', 'study', 'submit', 'get organised', 'ace this', 'do this'];

// "Your semester is ___". Long ones wrap onto two crushed lines.
export const ROAST_WORDS = [
  'Scattered',
  'Due tomorrow',
  'In four apps',
  'A group chat',
  'Seven tabs deep',
  'Final_final_v2',
  'Overdue',
  'Running on coffee',
  'On fire',
  'Untitled (3)',
  'Due at 11:59',
  'Vibes only',
  'Cooked',
  'In downloads',
  'Sticky notes',
];

// The chaos on the front of the flip card: a phone's downloads folder.
export const MESSY_FILES = [
  ['pdf', 'DBMS_unit3_FINAL(2).pdf'],
  ['docx', 'os notes NEW new.docx'],
  ['png', 'Screenshot 2026-10-03 at 23.58.png'],
  ['txt', 'assignment??.txt'],
  ['pptx', 'Untitled presentation (4).pptx'],
  ['pdf', 'DBMS_unit3_FINAL(2) copy.pdf'],
  ['pdf', 'lecture 7 (1).pdf'],
  ['jpg', 'IMG_4021.jpg'],
  ['docx', 'ai-assignment-draft-OLD.docx'],
];

export const FEATURES = [
  {
    title: 'Assignments',
    body: 'Every assignment gets a title, a subject, a due date and a priority. Mark it complete when it is done and it gets out of your way.',
  },
  {
    title: 'Deadlines',
    body: 'Noto counts down for you: due today, due tomorrow, due in 3 days, overdue by 1 day. The dashboard puts the most urgent one first, with a button to finish it.',
  },
  {
    title: 'Notes & files',
    body: 'Upload lecture notes, slides, PDFs and photos up to 10 MB each. They go to private cloud storage, and only your account can open them.',
  },
  {
    title: 'Subjects',
    body: 'File everything by subject. Each subject gets its own colour, so DBMS never gets lost between Operating Systems and AI.',
  },
  {
    title: 'Dashboard',
    body: 'One screen with your total, pending, completed and overdue work, what is due next and what you uploaded last.',
  },
  {
    title: 'Day & Night',
    body: 'A dark theme for 2 a.m. and a light one for the library. Noto follows your device, or remembers the one you pick.',
  },
];

// The AWS services behind Noto, for the "show our work" stack.
export const SERVICES = [
  {
    name: 'Cognito',
    nickname: 'the bouncer',
    image: login,
    alt: 'The Noto sign-in page',
    does: 'Handles sign-up, the emailed verification code and sign-in. Your password goes to Cognito and nowhere else; Noto’s own code never stores it.',
    when: 'Every time you create an account or sign in.',
  },
  {
    name: 'API Gateway',
    nickname: 'the front door',
    image: assignmentForm,
    alt: 'The new assignment form',
    does: 'The one HTTPS address the app talks to. It checks your sign-in token on every request and turns away anything without one before any code runs.',
    when: 'Whenever Noto loads or saves anything.',
  },
  {
    name: 'Lambda',
    nickname: 'the brains',
    image: dashboard,
    alt: 'The Noto dashboard with assignment totals and the next deadline',
    does: 'Three small functions, for assignments, subjects and files. They check what you send and that the data is yours. They only run when called, and each has its own narrow IAM role.',
    when: 'Behind every number on your dashboard.',
  },
  {
    name: 'DynamoDB',
    nickname: 'the memory',
    image: assignments,
    alt: 'The assignments page with filters and assignment cards',
    does: 'Stores your assignments, subjects and file details, filed under your user ID, so another account’s request can never reach them.',
    when: 'When an assignment is still there after a refresh.',
  },
  {
    name: 'S3',
    nickname: 'the filing cabinet',
    image: notes,
    alt: 'The notes page with uploaded files',
    does: 'Holds the files themselves. Your browser uploads straight into a private bucket with a short-lived signed link, and downloads work the same way.',
    when: 'Uploading or opening your notes.',
  },
  {
    name: 'CloudWatch',
    nickname: 'the night watch',
    image: null,
    does: 'Collects every function’s logs and watches for errors with alarms and a dashboard, so problems show up before anyone has to report them.',
    when: 'Hopefully never.',
  },
  {
    name: 'Amplify',
    nickname: 'the shop window',
    image: phoneMenu,
    alt: 'Noto’s menu on a phone',
    does: 'Serves this website over HTTPS through a content delivery network, with the same security headers on every page.',
    when: 'Right now.',
  },
];

// What the CloudWatch "screen" shows: the backend's real log lines (IDs shortened).
export const LOG_LINES = [
  ['info', 'Assignment creation started', 'POST /assignments'],
  ['info', 'Assignment created successfully', 'POST /assignments'],
  ['info', 'Upload authorized', 'POST /files'],
  ['info', 'Upload confirmed', 'POST /files/{id}/complete'],
  ['info', 'Download link created', 'GET /files/{id}/download'],
  ['info', 'Assignment updated', 'PUT /assignments/{id}'],
];

// The mystery dot's escalation. The last step rings the school bell.
export const DOT_STEPS = [
  { text: 'What’s that?', cursor: 'pointer' },
  { text: 'Stop clicking it!', cursor: 'not-allowed' },
  { text: 'It’s just a dot.', cursor: 'grab' },
  { text: 'No homework today?', cursor: 'grabbing' },
  { text: 'Last chance!', cursor: 'pointer' },
  { text: 'Happy now? Ding!', cursor: 'pointer' },
];
