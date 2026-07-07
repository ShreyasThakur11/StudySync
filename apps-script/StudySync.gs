/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          StudySync – MBA Study Group Management System               ║
 * ║                    Version 1.0.0 | Phase 1                           ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  QUICK SETUP:                                                        ║
 * ║  1. Go to script.google.com → New Project → Name it "StudySync"     ║
 * ║  2. Paste this entire script, replacing the default code             ║
 * ║  3. Click Run → createStudySyncSystem                                ║
 * ║  4. Authorize all permissions when prompted                          ║
 * ║  5. Wait ~60 seconds for setup to complete                           ║
 * ║  6. Check execution log for your spreadsheet URL                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
//  GLOBAL CONFIGURATION — Modify here before running
// ═══════════════════════════════════════════════════════════════════════

const CONFIG = {
  SPREADSHEET_NAME : 'StudySync – MBA Study Group Management',
  FORM_TITLE       : 'Study Group Automation Registration',
  FORM_DESCRIPTION : [
    'Welcome to the MBA Study Group Automation Registration.',
    'This information will be used for future automated reminders to ensure',
    'you never miss your daily news posting responsibility.',
    'Your data will only be used within the study group and will never be shared externally.',
    '\nFill this form only once. If you need to update your details, you may submit again.'
  ].join(' '),

  STUDY_GROUP_NAME : 'MBA Study Group',
  SPOC_NAME        : 'Shreyas Mahendra Thakur',
  SCHEDULE_DAYS    : 30,

  /** Pre-populated member list – maintain insertion order */
  MEMBERS: [
    'Tanish Raina',
    'B Chandra Mouli',
    'Arnav Bittu',
    'Rayapati Chandana Sushmitha',
    'Yella RamaSurya Pavan',
    'Thirupathi Koushik Sai',
    'Y Dhruv Suhaas',
    'Siddhant Mishra',
    'Ganesh Kumar R',
    'Aryan Raj',
    'Malde Aayush Pritesh',
    'Shreyas Mahendra Thakur',
    'Koppoal Likhita',
    'Seera Naveen Kumar',
    'N.S.V.N. Sathwika'
  ],

  /** Colour palette – used across all sheets */
  C: {
    NAVY        : '#1e3a5f',
    NAVY_LIGHT  : '#3c4b6b',
    BLUE        : '#1a73e8',
    GREEN       : '#34a853',
    AMBER       : '#f9ab00',
    RED         : '#d93025',
    TEAL        : '#00897b',
    PURPLE      : '#7c3aed',
    WHITE       : '#ffffff',
    LIGHT_GRAY  : '#f8f9fa',
    ALT_ROW     : '#f4f6fb',
    LIGHT_BLUE  : '#e8f0fe',
    LIGHT_GREEN : '#e6f4ea',
    LIGHT_AMBER : '#fef9e7',
    LIGHT_RED   : '#fce8e6',
    BORDER      : '#dadce0',
    DARK        : '#202124',
    GRAY        : '#5f6368',
  },

  /** Rolling news categories – one per scheduled day, cycling */
  NEWS_CATEGORIES: [
    'Business & Corporate',
    'Economics & Policy',
    'Finance & Markets',
    'Technology & AI',
    'Strategy & Consulting',
    'Operations & Supply Chain',
    'ESG & Sustainability',
    'Startups & Entrepreneurship',
    'Leadership & Management',
    'Indian Economy',
    'Global Economy',
    'Government & Regulations',
  ],
};


// ═══════════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Master function – creates the entire StudySync system.
 * Run ONCE from the Apps Script editor.
 */
function createStudySyncSystem() {
  Logger.log('🚀  StudySync setup starting…');

  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
  Logger.log('📄  Spreadsheet: ' + ss.getUrl());

  // Keep a reference to the auto-created Sheet1 so we can delete it last
  const defaultSheet = ss.getSheets()[0];

  // ── Create sheets in desired tab order ──────────────────────────────
  const S = {
    dashboard    : ss.insertSheet('📊 Dashboard'),
    members      : ss.insertSheet('👥 Members'),
    schedule     : ss.insertSheet('📅 Schedule'),
    newsSources  : ss.insertSheet('📰 News Sources'),
    settings     : ss.insertSheet('⚙️ Settings'),
    instructions : ss.insertSheet('📖 Instructions'),
  };

  // Assign tab colours
  S.dashboard   .setTabColor(CONFIG.C.BLUE);
  S.members     .setTabColor(CONFIG.C.GREEN);
  S.schedule    .setTabColor(CONFIG.C.AMBER);
  S.newsSources .setTabColor(CONFIG.C.TEAL);
  S.settings    .setTabColor(CONFIG.C.PURPLE);
  S.instructions.setTabColor(CONFIG.C.GRAY);

  // Remove the default blank sheet
  try { ss.deleteSheet(defaultSheet); } catch (_) {}

  // ── Populate each sheet ─────────────────────────────────────────────
  _setupSettings(ss, S.settings);
  _setupMembers(ss, S.members);
  _setupSchedule(ss, S.schedule);
  _setupDashboard(ss, S.dashboard);
  _setupNewsSources(ss, S.newsSources);
  _setupInstructions(ss, S.instructions);

  // ── Named ranges (for Phase 2 automation) ───────────────────────────
  _setupNamedRanges(ss, S);

  // ── Google Form ──────────────────────────────────────────────────────
  const form = _createForm(ss);

  // ── Form-submit trigger ──────────────────────────────────────────────
  _setupFormTrigger(ss);

  // ── Navigate back to Dashboard ────────────────────────────────────────
  ss.setActiveSheet(S.dashboard);

  const spreadsheetUrl = ss.getUrl();
  const formUrl        = form.getPublishedUrl();
  const formEditUrl    = form.getEditUrl();

  Logger.log('');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('✅  StudySync setup COMPLETE!');
  Logger.log('📊  Spreadsheet : ' + spreadsheetUrl);
  Logger.log('📝  Form (share): ' + formUrl);
  Logger.log('✏️   Form (edit) : ' + formEditUrl);
  Logger.log('═══════════════════════════════════════════');
  Logger.log('👉  Next: Share the Form URL with all members for onboarding.');
}

// ═══════════════════════════════════════════════════════════════════════
//  CUSTOM MENU — auto-added when spreadsheet opens
// ═══════════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 StudySync')
    .addItem('✅  Mark Today as Completed',  'markTodayCompleted')
    .addItem('🔄  Refresh Schedule',          'refreshSchedule')
    .addSeparator()
    .addItem('📊  Update Dashboard',          'updateDashboard')
    .addItem('🔁  Sync Form Responses',       'syncFormResponses')
    .addSeparator()
    .addItem('ℹ️   About StudySync',           'showAbout')
    .addToUi();
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: ⚙️ Settings
// ═══════════════════════════════════════════════════════════════════════

function _setupSettings(ss, sh) {
  const C = CONFIG.C;

  // Header
  _mergeTitle(sh, 1, 1, 1, 4, '⚙️  STUDYSYNC  —  SYSTEM SETTINGS', C.NAVY, 16, 55);
  _mergeSubtitle(sh, 2, 1, 1, 4,
    'Edit values in column B only. Do not rename or move rows — automation reads by row number.',
    C.LIGHT_GRAY, C.GRAY);
  _mergeTitle(sh, 3, 1, 1, 4, '', C.LIGHT_GRAY, 10, 12); // Thin spacer

  // Column headers
  const hdrs = ['Parameter', 'Value', 'Type', 'Description'];
  _writeRow(sh, 4, 1, hdrs, C.NAVY, C.WHITE, true, 11, 33);

  const today = new Date();
  const rows = [
    //  Parameter                         Value                              Type        Description
    ['Study Group Name',      'MBA Study Group',                   'Text',    'Name of the study group'],
    ['SPoC Name',             'Shreyas Mahendra Thakur',           'Text',    'Single Point of Contact for all queries'],
    ['Number of Members',     '=COUNTA(\'👥 Members\'!B4:B200)',   'Formula', 'Auto-calculated — do not edit'],
    ['Schedule Start Date',   today,                               'Date',    'First day of the 30-day schedule'],
    ['Reminder Time',         '08:00',                             'Time',    'Default reminder time [Phase 2]'],
    ['Reminder Interval',     1,                                   'Number',  'Reminder frequency in days [Phase 2]'],
    ['Maximum Reminders',     3,                                   'Number',  'Max reminders per event [Phase 2]'],
    ['Enable Weekends',       'FALSE',                             'Boolean', 'Include Sat/Sun in schedule (TRUE/FALSE)'],
    ['Schedule Days',         30,                                  'Number',  'Total days to generate in schedule'],
    ['Backup Member Enabled', 'TRUE',                              'Boolean', 'Assign a backup for each day (TRUE/FALSE)'],
    ['News Categories',       CONFIG.NEWS_CATEGORIES.join(', '),  'Text',    'Comma-separated list of categories'],
    ['WhatsApp Group Name',   'MBA Study Group',                   'Text',    'Group name for future WhatsApp automation'],
    ['Form Response Sheet',   'Form Responses 1',                  'Text',    'Sheet name created by Google Form'],
    ['System Version',        '1.0.0',                             'Text',    'Do not modify'],
    ['Phase',                 '1 – Foundation',                    'Text',    'Current system phase'],
    ['Last Setup',            today,                               'Date',    'Populated automatically on setup'],
  ];

  rows.forEach((r, i) => {
    const row = 5 + i;
    const bg  = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
    sh.getRange(row, 1, 1, 4).setValues([[r[0], r[1], r[2], r[3]]]).setBackground(bg);
    sh.getRange(row, 1).setFontWeight('bold').setFontColor(C.DARK);
    sh.getRange(row, 2).setFontColor(C.BLUE).setFontWeight('bold');
    sh.getRange(row, 4).setFontColor(C.GRAY).setFontStyle('italic');
    sh.setRowHeight(row, 28);
  });

  // Date formatting
  sh.getRange(8,  2).setNumberFormat('dd/mm/yyyy');  // Start Date
  sh.getRange(20, 2).setNumberFormat('dd/mm/yyyy');  // Last Setup

  // Dropdowns
  const boolDV = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE']).setAllowInvalid(false).build();
  sh.getRange(12, 2).setDataValidation(boolDV);  // Enable Weekends
  sh.getRange(14, 2).setDataValidation(boolDV);  // Backup Member Enabled

  // Column widths
  [220, 220, 110, 380].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  sh.setFrozenRows(4);
  sh.getRange(4, 1, rows.length + 1, 4)
    .setBorder(true, true, true, true, true, true, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: 👥 Members
// ═══════════════════════════════════════════════════════════════════════

function _setupMembers(ss, sh) {
  const C    = CONFIG.C;
  const COLS = 9;

  // Title
  _mergeTitle(sh, 1, 1, 1, COLS, '👥  MEMBERS  DIRECTORY', C.NAVY, 16, 52);
  sh.getRange(2, 1, 1, COLS).merge()
    .setFormula('="Total Members: "&COUNTA(B4:B200)&"  |  Active: "&COUNTIF(G4:G200,\"TRUE\")&"  |  Opted-In: "&COUNTIF(E4:E200,\"Yes\")')
    .setBackground(C.LIGHT_GRAY)
    .setFontColor(C.GRAY)
    .setFontStyle('italic')
    .setHorizontalAlignment('center')
    .setFontSize(10);
  sh.setRowHeight(2, 24);

  // Headers
  const hdrs = ['Member ID', 'Full Name', 'Mobile Number', 'Email Address',
                 'Automation Opt-In', 'Preferred Platform', 'Active Member', 'Date Joined', 'Remarks'];
  _writeRow(sh, 3, 1, hdrs, C.NAVY, C.WHITE, true, 11, 33);

  // Member data
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  const rows  = CONFIG.MEMBERS.map((name, i) => [
    'M' + String(i + 1).padStart(3, '0'),
    name, '', '', 'No', 'None', 'TRUE', today, ''
  ]);

  sh.getRange(4, 1, rows.length, COLS).setValues(rows);

  // Alternating row colours & row height
  for (let i = 0; i < rows.length + 30; i++) {
    const row = 4 + i;
    sh.setRowHeight(row, 29);
    if (i < rows.length) {
      sh.getRange(row, 1, 1, COLS).setBackground(i % 2 === 0 ? C.WHITE : C.ALT_ROW);
    }
  }

  // Data validation
  const dvOptIn    = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No']).setAllowInvalid(false)
    .setHelpText('Select Yes to receive future automated reminders.').build();
  const dvPlatform = SpreadsheetApp.newDataValidation()
    .requireValueInList(['WhatsApp', 'Telegram', 'Email', 'None']).setAllowInvalid(false).build();
  const dvActive   = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE']).setAllowInvalid(false).build();

  sh.getRange(4, 5, 100, 1).setDataValidation(dvOptIn);
  sh.getRange(4, 6, 100, 1).setDataValidation(dvPlatform);
  sh.getRange(4, 7, 100, 1).setDataValidation(dvActive);

  // Conditional formatting
  const cfRules = [
    _cfText(sh, 4, 5, 100, 'Yes',   C.LIGHT_GREEN, '#137333'),
    _cfText(sh, 4, 5, 100, 'No',    C.LIGHT_RED,   '#a50e0e'),
    _cfText(sh, 4, 7, 100, 'TRUE',  C.LIGHT_GREEN, '#137333'),
    _cfText(sh, 4, 7, 100, 'FALSE', C.LIGHT_RED,   '#a50e0e'),
  ];
  sh.setConditionalFormatRules(cfRules);

  // Alignment
  sh.getRange(4, 1, 100, 1).setHorizontalAlignment('center');   // ID
  sh.getRange(4, 5, 100, 3).setHorizontalAlignment('center');   // Opt-In, Platform, Active
  sh.getRange(4, 8, 100, 1).setHorizontalAlignment('center');   // Date

  // Column widths
  [85, 215, 150, 210, 145, 155, 125, 120, 190].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  sh.getRange(3, 1, rows.length + 1, COLS)
    .setBorder(true, true, true, true, true, true, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: 📅 Schedule
// ═══════════════════════════════════════════════════════════════════════

function _setupSchedule(ss, sh) {
  const C    = CONFIG.C;
  const COLS = 8;

  const hdrs = ['Date', 'Day', 'Assigned Member', 'Backup Member',
                 'News Category', 'Status', 'Completed At', 'Remarks'];

  _mergeTitle(sh, 1, 1, 1, COLS, '📅  NEWS POSTING SCHEDULE', C.NAVY, 16, 52);
  _mergeSubtitle(sh, 2, 1, 1, COLS,
    '30-Day Rotating Schedule  |  Each member posts TWICE  |  Update Status column after posting  |  Weekends excluded by default',
    C.LIGHT_GRAY, C.GRAY);
  _writeRow(sh, 3, 1, hdrs, C.NAVY, C.WHITE, true, 11, 33);

  // Generate schedule
  const schedule = _generateSchedule(new Date(), CONFIG.SCHEDULE_DAYS, false);

  const data = schedule.map(row => [
    row.date, row.dayName, row.assigned, row.backup, row.category, 'Pending', '', ''
  ]);

  if (data.length) sh.getRange(4, 1, data.length, COLS).setValues(data);

  // Date & timestamp formatting
  sh.getRange(4, 1, 60, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(4, 7, 60, 1).setNumberFormat('dd/mm/yyyy hh:mm');

  // Status dropdown
  const dvStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Completed', 'Missed', 'Reassigned'])
    .setAllowInvalid(false).build();
  sh.getRange(4, 6, 60, 1).setDataValidation(dvStatus);

  // Conditional formatting
  sh.setConditionalFormatRules([
    _cfText(sh, 4, 6, 60, 'Completed',  C.LIGHT_GREEN, '#137333'),
    _cfText(sh, 4, 6, 60, 'Pending',    C.LIGHT_AMBER, '#f57c00'),
    _cfText(sh, 4, 6, 60, 'Missed',     C.LIGHT_RED,   '#a50e0e'),
    _cfText(sh, 4, 6, 60, 'Reassigned', C.LIGHT_BLUE,  '#1a73e8'),
  ]);

  // Row colours & today highlight
  for (let i = 0; i < schedule.length; i++) {
    const row = 4 + i;
    sh.setRowHeight(row, 29);
    if (_isToday(schedule[i].date)) {
      sh.getRange(row, 1, 1, COLS)
        .setBackground('#fff8e1')
        .setFontWeight('bold')
        .setBorder(true, true, true, true, false, false, C.AMBER, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    } else {
      sh.getRange(row, 1, 1, COLS).setBackground(i % 2 === 0 ? C.WHITE : C.ALT_ROW);
    }
  }

  // Column widths
  [110, 105, 205, 205, 165, 120, 150, 205].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  // Alignment
  sh.getRange(4, 1, 60, 2).setHorizontalAlignment('center');
  sh.getRange(4, 5, 60, 2).setHorizontalAlignment('center');
  sh.getRange(4, 7, 60, 1).setHorizontalAlignment('center');

  sh.setFrozenRows(3);
  sh.getRange(3, 1, schedule.length + 1, COLS)
    .setBorder(true, true, true, true, true, true, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
}

/** Generates an array of schedule objects */
function _generateSchedule(startDate, totalDays, includeWeekends) {
  const members    = CONFIG.MEMBERS;
  const categories = CONFIG.NEWS_CATEGORIES;
  const schedule   = [];
  let   mIdx = 0;
  const d    = new Date(startDate);
  d.setHours(0, 0, 0, 0);

  // Safety cap: never loop more than 120 calendar days
  const cap = new Date(d.getTime() + 120 * 864e5);

  while (schedule.length < totalDays && d <= cap) {
    const dow       = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    if (includeWeekends || !isWeekend) {
      schedule.push({
        date    : new Date(d),
        dayName : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow],
        assigned: members[mIdx % members.length],
        backup  : members[(mIdx + 1) % members.length],
        category: categories[mIdx % categories.length],
      });
      mIdx++;
    }
    d.setDate(d.getDate() + 1);
  }
  return schedule;
}

function _isToday(date) {
  const t = new Date();
  return date.getDate()     === t.getDate()  &&
         date.getMonth()    === t.getMonth() &&
         date.getFullYear() === t.getFullYear();
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: 📊 Dashboard
// ═══════════════════════════════════════════════════════════════════════

function _setupDashboard(ss, sh) {
  const C = CONFIG.C;

  // ── HEADER BANNER ────────────────────────────────────────────────────
  sh.getRange(1, 1, 1, 10).merge()
    .setValue('📊  StudySync  —  Dashboard')
    .setBackground(C.NAVY).setFontColor(C.WHITE)
    .setFontSize(22).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(1, 62);

  sh.getRange(2, 1, 1, 10).merge()
    .setFormula('="MBA Study Group  |  Last Refreshed: "&TEXT(NOW(),\"dd MMM yyyy  HH:mm\")')
    .setBackground('#253f6b').setFontColor('#90caf9')
    .setFontStyle('italic').setHorizontalAlignment('center').setFontSize(11);
  sh.setRowHeight(2, 28);

  sh.setRowHeight(3, 14); // spacer

  // ── TODAY / TOMORROW CARDS ────────────────────────────────────────────
  _dashCard(sh, 4, 1, 4, 5, {
    label   : "📌  TODAY'S  POSTING",
    formula : "=IFERROR(INDEX('📅 Schedule'!C:C,MATCH(TODAY(),'📅 Schedule'!A:A,0)),\"— No assignment today —\")",
    note    : '=TEXT(TODAY(),"dddd, dd MMMM yyyy")',
    hdrBg   : C.NAVY, valBg: C.LIGHT_BLUE, valColor: C.BLUE, sz: 20,
  });
  _dashCard(sh, 4, 6, 4, 5, {
    label   : "📆  TOMORROW'S  POSTING",
    formula : "=IFERROR(INDEX('📅 Schedule'!C:C,MATCH(TODAY()+1,'📅 Schedule'!A:A,0)),\"— No assignment —\")",
    note    : '=TEXT(TODAY()+1,"dddd, dd MMMM yyyy")',
    hdrBg   : C.TEAL, valBg: '#e0f2f1', valColor: '#004d40', sz: 20,
  });

  sh.setRowHeight(8, 14); // spacer

  // ── STATS ROW (5 KPI tiles) ───────────────────────────────────────────
  const kpis = [
    { label: '👥 TOTAL MEMBERS', f: "=COUNTA('👥 Members'!B4:B200)",                                  bg: C.LIGHT_BLUE,  clr: C.BLUE    },
    { label: '✅ ACTIVE',        f: "=COUNTIF('👥 Members'!G4:G200,\"TRUE\")",                         bg: C.LIGHT_GREEN, clr: '#137333' },
    { label: '✅ COMPLETED',     f: "=COUNTIF('📅 Schedule'!F4:F100,\"Completed\")",                   bg: C.LIGHT_GREEN, clr: '#137333' },
    { label: '⏳ PENDING',       f: "=COUNTIF('📅 Schedule'!F4:F100,\"Pending\")",                     bg: C.LIGHT_AMBER, clr: '#e65100' },
    { label: '❌ MISSED',        f: "=COUNTIF('📅 Schedule'!F4:F100,\"Missed\")",                      bg: C.LIGHT_RED,   clr: '#b71c1c' },
  ];

  const kpiCols = [1, 3, 5, 7, 9];
  kpis.forEach(({ label, f, bg, clr }, i) => {
    const col = kpiCols[i];
    // Title bar
    sh.getRange(9, col, 1, 2).merge()
      .setValue(label)
      .setBackground(C.NAVY).setFontColor(C.WHITE).setFontWeight('bold')
      .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.setRowHeight(9, 28);
    // Value
    sh.getRange(10, col, 2, 2).merge()
      .setFormula(f)
      .setBackground(bg).setFontColor(clr)
      .setFontWeight('bold').setFontSize(30)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.setRowHeight(10, 38);
    sh.setRowHeight(11, 38);
  });

  sh.setRowHeight(12, 14); // spacer

  // ── COMPLETION RATE BAR ──────────────────────────────────────────────
  sh.getRange(13, 1, 1, 10).merge()
    .setValue('📈  COMPLETION  RATE')
    .setBackground(C.NAVY).setFontColor(C.WHITE)
    .setFontWeight('bold').setFontSize(12)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(13, 33);

  sh.getRange(14, 1, 2, 10).merge()
    .setFormula([
      "=IFERROR(",
      "TEXT(COUNTIF('📅 Schedule'!F4:F100,\"Completed\")/COUNTA('📅 Schedule'!F4:F100),\"0.0%\")",
      "&\"  completion  (\"",
      "&COUNTIF('📅 Schedule'!F4:F100,\"Completed\")",
      "&\" of \"&COUNTA('📅 Schedule'!F4:F100)&\" days completed)\"",
      ",\"No data yet\")"
    ].join(''))
    .setBackground(C.LIGHT_BLUE).setFontColor(C.BLUE)
    .setFontSize(18).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(14, 38);
  sh.setRowHeight(15, 38);

  sh.setRowHeight(16, 14); // spacer

  // ── UPCOMING SCHEDULE (7 days) ───────────────────────────────────────
  sh.getRange(17, 1, 1, 6).merge()
    .setValue('📋  UPCOMING SCHEDULE — Next 7 Days')
    .setBackground(C.NAVY).setFontColor(C.WHITE)
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
  sh.setRowHeight(17, 33);

  const upHdrs = ['Date', 'Day', 'Assigned Member', 'Backup Member', 'Category', 'Status'];
  _writeRow(sh, 18, 1, upHdrs, C.NAVY_LIGHT, C.WHITE, true, 10, 29);

  for (let i = 0; i < 7; i++) {
    const row  = 19 + i;
    const sRow = 4 + i;
    const bg   = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
    sh.setRowHeight(row, 27);
    sh.getRange(row, 1).setFormula(`=IFERROR(TEXT('📅 Schedule'!A${sRow},"dd/mm/yyyy"),"")`).setBackground(bg).setHorizontalAlignment('center');
    sh.getRange(row, 2).setFormula(`=IFERROR('📅 Schedule'!B${sRow},"")`).setBackground(bg).setHorizontalAlignment('center');
    sh.getRange(row, 3).setFormula(`=IFERROR('📅 Schedule'!C${sRow},"")`).setBackground(bg);
    sh.getRange(row, 4).setFormula(`=IFERROR('📅 Schedule'!D${sRow},"")`).setBackground(bg);
    sh.getRange(row, 5).setFormula(`=IFERROR('📅 Schedule'!E${sRow},"")`).setBackground(bg).setHorizontalAlignment('center');
    sh.getRange(row, 6).setFormula(`=IFERROR('📅 Schedule'!F${sRow},"")`).setBackground(bg).setHorizontalAlignment('center');
  }

  sh.setRowHeight(26, 14); // spacer

  // ── MEMBER PARTICIPATION TABLE ──────────────────────────────────────
  sh.getRange(27, 1, 1, 5).merge()
    .setValue('👤  MEMBER PARTICIPATION TRACKER')
    .setBackground(C.NAVY).setFontColor(C.WHITE)
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
  sh.setRowHeight(27, 33);

  const mHdrs = ['Member Name', 'Assigned', 'Completed', 'Pending', 'Missed'];
  _writeRow(sh, 28, 1, mHdrs, C.NAVY_LIGHT, C.WHITE, true, 10, 29);

  CONFIG.MEMBERS.forEach((name, i) => {
    const row = 29 + i;
    const bg  = i % 2 === 0 ? C.WHITE : C.ALT_ROW;
    sh.setRowHeight(row, 26);
    sh.getRange(row, 1).setValue(name).setBackground(bg).setFontSize(10);
    sh.getRange(row, 2)
      .setFormula(`=COUNTIF('📅 Schedule'!C:C,"${name}")`)
      .setBackground(bg).setHorizontalAlignment('center').setFontColor(C.BLUE);
    sh.getRange(row, 3)
      .setFormula(`=COUNTIFS('📅 Schedule'!C:C,"${name}",'📅 Schedule'!F:F,"Completed")`)
      .setBackground(bg).setHorizontalAlignment('center').setFontColor('#137333').setFontWeight('bold');
    sh.getRange(row, 4)
      .setFormula(`=COUNTIFS('📅 Schedule'!C:C,"${name}",'📅 Schedule'!F:F,"Pending")`)
      .setBackground(bg).setHorizontalAlignment('center').setFontColor('#e65100');
    sh.getRange(row, 5)
      .setFormula(`=COUNTIFS('📅 Schedule'!C:C,"${name}",'📅 Schedule'!F:F,"Missed")`)
      .setBackground(bg).setHorizontalAlignment('center').setFontColor('#b71c1c');
  });

  // Column widths
  [160, 160, 160, 160, 160, 140, 140, 140, 140, 140]
    .forEach((w, i) => sh.setColumnWidth(i + 1, w));

  sh.setFrozenRows(2);
}

/** Creates a 2-section card (title + value + note) */
function _dashCard(sh, startRow, startCol, numRows, numCols, opts) {
  const { label, formula, note, hdrBg, valBg, valColor, sz } = opts;
  const C = CONFIG.C;

  sh.getRange(startRow, startCol, 1, numCols).merge()
    .setValue(label)
    .setBackground(hdrBg).setFontColor(C.WHITE)
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(startRow, 34);

  sh.getRange(startRow + 1, startCol, numRows - 2, numCols).merge()
    .setFormula(formula)
    .setBackground(valBg).setFontColor(valColor)
    .setFontWeight('bold').setFontSize(sz)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  for (let r = startRow + 1; r < startRow + numRows - 1; r++) sh.setRowHeight(r, 38);

  sh.getRange(startRow + numRows - 1, startCol, 1, numCols).merge()
    .setFormula(note)
    .setBackground(valBg).setFontColor(C.GRAY)
    .setFontStyle('italic').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(startRow + numRows - 1, 24);
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: 📰 News Sources
// ═══════════════════════════════════════════════════════════════════════

function _setupNewsSources(ss, sh) {
  const C    = CONFIG.C;
  const COLS = 5;
  const hdrs = ['Category', 'Website / Source', 'Description', 'Priority', 'Suggested Reading'];

  _mergeTitle(sh, 1, 1, 1, COLS, '📰  CURATED NEWS SOURCES & RESOURCES', C.NAVY, 16, 52);
  _mergeSubtitle(sh, 2, 1, 1, COLS,
    'Organised by category  |  Priority: High = Must Read · Medium = Recommended · Low = Optional',
    C.LIGHT_GRAY, C.GRAY);
  _writeRow(sh, 3, 1, hdrs, C.NAVY, C.WHITE, true, 11, 33);

  const data = [
    // ── Business & Corporate ──
    ['Business & Corporate', 'Harvard Business Review — hbr.org',           'World\'s leading business management publication',                   'High',   '15 min'],
    ['Business & Corporate', 'Wall Street Journal — wsj.com',               'Leading US business and financial newspaper',                        'High',   '20 min'],
    ['Business & Corporate', 'Financial Times — ft.com',                    'Global business, markets and financial news',                        'High',   '20 min'],
    ['Business & Corporate', 'Bloomberg — bloomberg.com',                   'Real-time global financial and business news',                       'High',   '15 min'],
    ['Business & Corporate', 'Business Today — businesstoday.in',           'Indian business news and corporate affairs',                         'High',   '15 min'],
    ['Business & Corporate', 'Forbes — forbes.com',                         'Business, investing, technology, entrepreneurship',                  'Medium', '10 min'],
    // ── Economics & Policy ──
    ['Economics & Policy',   'The Economist — economist.com',               'Global economics, politics, science and technology',                 'High',   '20 min'],
    ['Economics & Policy',   'IMF Blog — imf.org/en/Blogs',                 'International Monetary Fund economic analysis and forecasts',        'High',   '10 min'],
    ['Economics & Policy',   'World Bank Blogs — blogs.worldbank.org',      'Global development and poverty reduction insights',                  'Medium', '10 min'],
    ['Economics & Policy',   'NITI Aayog — niti.gov.in',                   'India\'s premier policy think tank reports and publications',        'Medium', '10 min'],
    ['Economics & Policy',   'VoxEU — cepr.org/voxeu',                     'Research-based policy analysis by leading economists',               'Medium', '15 min'],
    // ── Finance & Markets ──
    ['Finance & Markets',    'Moneycontrol — moneycontrol.com',             'India\'s leading financial and investment portal',                   'High',   '15 min'],
    ['Finance & Markets',    'Economic Times Markets — economictimes.com',  'Indian market news, stocks, mutual funds',                           'High',   '15 min'],
    ['Finance & Markets',    'Mint — livemint.com',                         'Indian business and personal finance news',                          'High',   '15 min'],
    ['Finance & Markets',    'Zerodha Varsity — zerodha.com/varsity',       'Free comprehensive financial market education',                      'Medium', '20 min'],
    ['Finance & Markets',    'Investopedia — investopedia.com',             'Investment, finance, and economic education',                        'Medium', '10 min'],
    ['Finance & Markets',    'NSE India — nseindia.com',                    'National Stock Exchange official data and circulars',                'Low',    '5 min'],
    // ── Technology & AI ──
    ['Technology & AI',      'MIT Technology Review — technologyreview.com','Authoritative technology and innovation insights',                   'High',   '15 min'],
    ['Technology & AI',      'TechCrunch — techcrunch.com',                 'Startup and technology news, funding rounds',                        'High',   '10 min'],
    ['Technology & AI',      'Wired — wired.com',                           'Technology, culture, business and their societal impact',            'Medium', '15 min'],
    ['Technology & AI',      'The Batch (DeepLearning.AI) — deeplearning.ai','Weekly AI research and industry news digest',                      'High',   '10 min'],
    ['Technology & AI',      'AI Business — aibusiness.com',                'Enterprise AI adoption and strategy news',                          'Medium', '10 min'],
    // ── Strategy & Consulting ──
    ['Strategy & Consulting','McKinsey Insights — mckinsey.com/insights',   'Strategy, operations, digital transformation insights',              'High',   '15 min'],
    ['Strategy & Consulting','BCG Insights — bcg.com/insights',             'Business strategy and transformation research',                      'High',   '15 min'],
    ['Strategy & Consulting','Bain & Company — bain.com/insights',          'Management consulting thought leadership',                           'High',   '10 min'],
    ['Strategy & Consulting','MIT Sloan Review — sloanreview.mit.edu',      'Rigorous management research for practitioners',                     'Medium', '15 min'],
    ['Strategy & Consulting','Deloitte Insights — deloitte.com/insights',   'Cross-industry business and technology insights',                    'Medium', '10 min'],
    // ── Operations & Supply Chain ──
    ['Operations & Supply Chain','Supply Chain Dive — supplychaindive.com', 'Latest supply chain industry news and analysis',                    'High',   '10 min'],
    ['Operations & Supply Chain','Logistics Management — logisticsmgmt.com','Logistics and supply chain management coverage',                    'Medium', '10 min'],
    ['Operations & Supply Chain','ASCM (APICS) — ascm.org',                'Professional supply chain management association content',           'Medium', '10 min'],
    ['Operations & Supply Chain','Supply Chain Brain — supplychainbrain.com','End-to-end supply chain technology and strategy',                  'Medium', '10 min'],
    // ── ESG & Sustainability ──
    ['ESG & Sustainability', 'GreenBiz — greenbiz.com',                     'Business and sustainability intersection news',                      'High',   '10 min'],
    ['ESG & Sustainability', 'ESG Today — esgtoday.com',                    'Dedicated ESG investing and corporate responsibility news',          'High',   '10 min'],
    ['ESG & Sustainability', 'World Economic Forum — weforum.org',           'Global agenda on economy, environment and society',                 'High',   '15 min'],
    ['ESG & Sustainability', 'UN SDGs — un.org/sustainabledevelopment',     'United Nations Sustainable Development Goals updates',               'Medium', '10 min'],
    // ── Startups & Entrepreneurship ──
    ['Startups & Entrepreneurship','Inc42 — inc42.com',                     'Indian startup ecosystem news, funding, analysis',                  'High',   '10 min'],
    ['Startups & Entrepreneurship','VCCircle — vccircle.com',               'India PE/VC deals, fundraising and M&A news',                       'High',   '10 min'],
    ['Startups & Entrepreneurship','Entrackr — entrackr.com',               'Indian startup financial data and funding tracker',                 'High',   '10 min'],
    ['Startups & Entrepreneurship','YC Blog — ycombinator.com/blog',        'Y Combinator essays and founder insights',                          'Medium', '15 min'],
    ['Startups & Entrepreneurship','Startup India — startupindia.gov.in',   'Government startup initiative news and schemes',                    'Low',    '5 min'],
    // ── Leadership & Management ──
    ['Leadership & Management','HBR Leadership — hbr.org/leadership',       'Leadership research, case studies and best practices',              'High',   '15 min'],
    ['Leadership & Management','Forbes Leadership — forbes.com/leadership', 'Leadership insights and lessons from top executives',               'Medium', '10 min'],
    ['Leadership & Management','Gallup Workplace — gallup.com/workplace',   'Workplace engagement, culture and management research',             'Medium', '10 min'],
    // ── Indian Economy ──
    ['Indian Economy',       'Reserve Bank of India — rbi.org.in',          'Monetary policy, annual reports and official publications',          'High',   '15 min'],
    ['Indian Economy',       'CMIE — cmie.com',                             'Centre for Monitoring Indian Economy data and forecasts',            'High',   '10 min'],
    ['Indian Economy',       'MoSPI — mospi.gov.in',                        'Ministry of Statistics: GDP, CPI and economic indicators',          'Medium', '5 min'],
    ['Indian Economy',       'Business Standard — business-standard.com',   'Comprehensive Indian economy and business news',                    'High',   '15 min'],
    ['Indian Economy',       'The Hindu BusinessLine — thehindubusinessline.com','Economy, agriculture and trade news from India',               'Medium', '10 min'],
    // ── Global Economy ──
    ['Global Economy',       'World Bank — worldbank.org',                  'Global economic data, development reports and research',            'High',   '15 min'],
    ['Global Economy',       'OECD — oecd.org',                             'Economic cooperation, statistics and policy analysis',              'Medium', '10 min'],
    ['Global Economy',       'Project Syndicate — project-syndicate.org',   'Expert global economic commentary and analysis',                    'Medium', '15 min'],
    // ── Government & Regulations ──
    ['Government & Regulations','PIB India — pib.gov.in',                  'Press Information Bureau: official Indian government news',         'High',   '10 min'],
    ['Government & Regulations','Ministry of Finance — finmin.nic.in',      'Budget documents, policy updates, finance ministry releases',       'High',   '10 min'],
    ['Government & Regulations','SEBI — sebi.gov.in',                       'Securities & Exchange Board of India circulars and orders',        'Medium', '10 min'],
    ['Government & Regulations','MyGov — mygov.in',                         'Government initiatives, citizen engagement programmes',            'Low',    '5 min'],
    // ── Manufacturing ──
    ['Manufacturing',        'Industry Week — industryweek.com',            'Manufacturing strategy, operations and technology news',            'Medium', '10 min'],
    ['Manufacturing',        'Make in India — makeinindia.com',             'India manufacturing initiative news and sector reports',            'Medium', '10 min'],
  ];

  sh.getRange(4, 1, data.length, COLS).setValues(data);

  // Priority dropdown
  const dvPriority = SpreadsheetApp.newDataValidation()
    .requireValueInList(['High', 'Medium', 'Low']).setAllowInvalid(false).build();
  sh.getRange(4, 4, data.length + 20, 1).setDataValidation(dvPriority);

  // Conditional formatting on priority
  sh.setConditionalFormatRules([
    _cfText(sh, 4, 4, data.length, 'High',   C.LIGHT_GREEN, '#137333'),
    _cfText(sh, 4, 4, data.length, 'Medium', C.LIGHT_AMBER, '#e65100'),
    _cfText(sh, 4, 4, data.length, 'Low',    C.LIGHT_RED,   '#a50e0e'),
  ]);

  // Category-grouped alternating colours
  const catPalette = [
    '#e8f0fe','#e6f4ea','#fef9e7','#fce8e6','#f3e5f5',
    '#e0f7fa','#fff3e0','#e8eaf6','#f1f8e9','#fce4ec',
    '#e0f2f1','#f9fbe7','#ede7f6','#e3f2fd'
  ];
  let lastCat = ''; let ci = -1;
  data.forEach((row, i) => {
    if (row[0] !== lastCat) { ci = (ci + 1) % catPalette.length; lastCat = row[0]; }
    sh.getRange(4 + i, 1, 1, COLS).setBackground(catPalette[ci]);
    sh.setRowHeight(4 + i, 25);
  });

  // Column widths
  [175, 290, 330, 95, 145].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  // Alignment
  sh.getRange(4, 4, data.length, 2).setHorizontalAlignment('center');

  sh.setFrozenRows(3);
  sh.getRange(3, 1, data.length + 1, COLS)
    .setBorder(true, true, true, true, true, true, C.BORDER, SpreadsheetApp.BorderStyle.SOLID);
}


// ═══════════════════════════════════════════════════════════════════════
//  SHEET: 📖 Instructions
// ═══════════════════════════════════════════════════════════════════════

function _setupInstructions(ss, sh) {
  const C = CONFIG.C;

  _mergeTitle(sh, 1, 1, 1, 2, '📖  StudySync  USER GUIDE', C.NAVY, 18, 60);

  const sections = [
    {
      hdr: '🎯  WHAT IS STUDYSYNC?',
      body: [
        'StudySync is a shared-responsibility management tool for your MBA Study Group.',
        'Every day, one member is responsible for posting curated news articles to the group, keeping all 15 members informed about business, economy, technology and more.',
        'The system automatically rotates posting duties among all 15 members over a 30-day cycle — so each member posts EXACTLY TWICE.',
        'This guide explains how to use every feature of the system.',
      ]
    },
    {
      hdr: '📅  HOW THE SCHEDULE WORKS',
      body: [
        '1. The 30-day schedule is pre-generated in the 📅 Schedule sheet.',
        '2. Members are assigned in a fixed rotation. With 15 members over 30 days, each member posts exactly twice.',
        '3. Weekends are excluded by default (change "Enable Weekends" to TRUE in ⚙️ Settings to include them).',
        '4. Each day has a Primary Assigned Member and a Backup Member.',
        '5. The Dashboard always shows today\'s and tomorrow\'s assignment at the top.',
        '6. Today\'s row is highlighted in yellow with a bold border in the Schedule sheet.',
      ]
    },
    {
      hdr: '✅  HOW TO MARK A TASK AS COMPLETED',
      body: [
        '1. Open the 📅 Schedule sheet.',
        '2. Find today\'s row (highlighted in yellow).',
        '3. Click the Status cell (Column F) for today.',
        '4. Select "Completed" from the dropdown.',
        '5. Optionally enter the posting time in "Completed At" (Column G).',
        '6. The row turns green automatically and the Dashboard updates.',
        '💡 SHORTCUT: Use the StudySync menu → "✅ Mark Today as Completed" for one-click completion.',
      ]
    },
    {
      hdr: '📋  HOW TO UPDATE YOUR CONTACT INFORMATION',
      body: [
        'Option A — Via Google Form (Recommended):',
        '  Fill out the Study Group Automation Registration Form shared by the SPoC.',
        '  Your details will auto-populate your row in the Members sheet.',
        '',
        'Option B — Directly in the Sheet:',
        '  1. Open the 👥 Members sheet.',
        '  2. Find your name.',
        '  3. Fill in Mobile Number, Email Address, Automation Opt-In, and Preferred Platform.',
      ]
    },
    {
      hdr: '🔔  HOW TO OPT INTO FUTURE AUTOMATION',
      body: [
        '1. Fill out the Study Group Automation Registration Form.',
        '2. Select "Yes" for "Would you like to receive automated reminders?"',
        '3. Choose your preferred platform: WhatsApp, Telegram, or Email.',
        '4. Your preference is saved and will be used when Phase 2 is activated.',
        '⚠️ NOTE: Automation is NOT active in Phase 1. This step only records your preferences.',
      ]
    },
    {
      hdr: '🔁  HOW BACKUP ASSIGNMENTS WORK',
      body: [
        '1. Every day has both a Primary and a Backup member (next person in rotation).',
        '2. If you cannot post on your assigned day, notify your Backup and the SPoC immediately.',
        '3. The SPoC changes the Status to "Reassigned" in the Schedule sheet.',
        '4. The Backup posts and the SPoC marks the status as "Completed".',
        '5. Add a note in the Remarks column explaining the reassignment.',
      ]
    },
    {
      hdr: '🔄  HOW TO REGENERATE THE SCHEDULE',
      body: [
        '1. Update "Schedule Start Date" in ⚙️ Settings.',
        '2. Change "Enable Weekends" if needed.',
        '3. Use StudySync menu → "🔄 Refresh Schedule".',
        '4. Confirm the dialog — the schedule regenerates while preserving past completions.',
        '⚠️ WARNING: Always confirm before refreshing. Previous incomplete entries may be reset.',
      ]
    },
    {
      hdr: '🤖  FUTURE AUTOMATION — Phase 2 Preview',
      body: [
        'In Phase 2, the system will gain full automation. Here is what to expect:',
        '• Daily reminder messages sent at the configured Reminder Time.',
        '• Messages delivered via WhatsApp, Telegram, or Email based on your preference.',
        '• Follow-up reminders if the status is not updated within the day.',
        '• Automated completion reports shared with all members weekly.',
        '• Analytics: participation rates, streak tracking, missed-day reporting.',
        '📌 No changes to this spreadsheet structure will be required for Phase 2.',
        '📌 All configuration is already in ⚙️ Settings — automation reads from there.',
      ]
    },
    {
      hdr: '📞  CONTACT & SUPPORT',
      body: [
        'SPoC (Single Point of Contact): Shreyas Mahendra Thakur',
        'GitHub Repository: github.com/ShreyasThakur11',
        'System Version: 1.0.0  |  Phase: 1 – Foundation',
        'Built with Google Apps Script — no third-party services required in Phase 1.',
      ]
    },
  ];

  let currentRow = 2;
  sections.forEach(({ hdr, body }) => {
    currentRow++;
    sh.getRange(currentRow, 1, 1, 2).merge()
      .setValue(hdr)
      .setBackground(C.NAVY).setFontColor(C.WHITE)
      .setFontWeight('bold').setFontSize(12)
      .setVerticalAlignment('middle');
    sh.setRowHeight(currentRow, 34);
    currentRow++;

    body.forEach(line => {
      sh.getRange(currentRow, 2).setValue(line).setWrap(true);
      const bg = line.startsWith('⚠️') ? C.LIGHT_RED  :
                 line.startsWith('💡') ? C.LIGHT_BLUE  :
                 line.startsWith('📌') ? C.LIGHT_AMBER :
                 currentRow % 2 === 0 ? C.WHITE : C.ALT_ROW;
      sh.getRange(currentRow, 1, 1, 2).setBackground(bg);
      sh.setRowHeight(currentRow, 24);
      currentRow++;
    });
    currentRow++; // spacer
    sh.setRowHeight(currentRow - 1, 10);
  });

  sh.setColumnWidth(1, 18);
  sh.setColumnWidth(2, 750);
  sh.setFrozenRows(1);
}


// ═══════════════════════════════════════════════════════════════════════
//  GOOGLE FORM
// ═══════════════════════════════════════════════════════════════════════

function _createForm(ss) {
  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(CONFIG.FORM_DESCRIPTION);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage(
    'Thank you for registering! ✅\n\n' +
    'Your details have been recorded. The SPoC will verify your information.\n' +
    'You will be notified when Phase 2 automation is activated.\n\n' +
    'If you need to update your information, simply submit this form again.'
  );

  // Q1 – Full Name
  form.addTextItem()
    .setTitle('Full Name')
    .setHelpText('Enter your full name exactly as it appears in the study group list.')
    .setRequired(true);

  // Q2 – Mobile
  form.addTextItem()
    .setTitle('Mobile Number (with country code)')
    .setHelpText('Example: +91 98765 43210')
    .setRequired(true);

  // Q3 – Email
  form.addTextItem()
    .setTitle('Email Address')
    .setHelpText('Your primary email for study group communications.')
    .setRequired(true);

  // Q4 – Opt-In
  form.addMultipleChoiceItem()
    .setTitle('Would you like to receive automated reminders?')
    .setHelpText('If Yes, reminders will be sent on your posting days when Phase 2 is activated.')
    .setChoiceValues(['Yes – I want reminders', 'No – I will check the schedule manually'])
    .setRequired(true);

  // Q5 – Platform
  form.addMultipleChoiceItem()
    .setTitle('Preferred Reminder Platform')
    .setHelpText('Select where you want to receive reminders. Only used if you opted in above.')
    .setChoiceValues(['WhatsApp', 'Telegram', 'Email', 'None'])
    .setRequired(true);

  // Q6 – Best Time
  form.addTextItem()
    .setTitle('Best Time to Receive Reminder (Optional)')
    .setHelpText('Example: 8:00 AM, 10:00 PM')
    .setRequired(false);

  // Q7 – Remarks
  form.addParagraphTextItem()
    .setTitle('Any Additional Remarks or Suggestions')
    .setHelpText('Optional — share any preferences, constraints or feedback about the system.')
    .setRequired(false);

  // Link form responses to spreadsheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  return form;
}


// ═══════════════════════════════════════════════════════════════════════
//  FORM TRIGGER
// ═══════════════════════════════════════════════════════════════════════

function _setupFormTrigger(ss) {
  // Remove stale triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log('✅  Form submission trigger created');
}

/**
 * Runs on every form submission.
 * Finds the member by name (fuzzy match) and updates their Members row.
 * Will NOT create duplicates.
 */
function onFormSubmit(e) {
  try {
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const mSheet  = ss.getSheetByName('👥 Members');
    if (!mSheet) return;

    const nv     = e.namedValues;
    const name   = (nv['Full Name']   || [''])[0].trim();
    const mobile = (nv['Mobile Number (with country code)'] || [''])[0].trim();
    const email  = (nv['Email Address']    || [''])[0].trim();
    const rawOptIn   = (nv['Would you like to receive automated reminders?'] || ['No'])[0];
    const optIn  = rawOptIn.startsWith('Yes') ? 'Yes' : 'No';
    const platform   = (nv['Preferred Reminder Platform'] || ['None'])[0];
    const remarks    = (nv['Any Additional Remarks or Suggestions'] || [''])[0];

    const names = mSheet.getRange(4, 2, 100, 1).getValues();
    let   targetRow = -1;

    for (let i = 0; i < names.length; i++) {
      const cell = names[i][0].toString().trim().toLowerCase();
      if (!cell) continue;
      if (cell === name.toLowerCase() ||
          cell.includes(name.toLowerCase()) ||
          name.toLowerCase().includes(cell)) {
        targetRow = 4 + i;
        break;
      }
    }

    if (targetRow < 0) {
      Logger.log('⚠️  Form response: member not found → ' + name);
      return;
    }

    mSheet.getRange(targetRow, 3).setValue(mobile);
    mSheet.getRange(targetRow, 4).setValue(email);
    mSheet.getRange(targetRow, 5).setValue(optIn);
    mSheet.getRange(targetRow, 6).setValue(platform);
    if (remarks) mSheet.getRange(targetRow, 9).setValue(remarks);

    Logger.log('✅  Form response synced for: ' + name);
  } catch (err) {
    Logger.log('❌  onFormSubmit error: ' + err.toString());
  }
}


// ═══════════════════════════════════════════════════════════════════════
//  NAMED RANGES — Phase 2 automation reads these by name
// ═══════════════════════════════════════════════════════════════════════

function _setupNamedRanges(ss, S) {
  try {
    // Settings
    const st = S.settings;
    ss.setNamedRange('CFG_StartDate',       st.getRange(8,  2));
    ss.setNamedRange('CFG_EnableWeekends',  st.getRange(12, 2));
    ss.setNamedRange('CFG_ReminderTime',    st.getRange(9,  2));
    ss.setNamedRange('CFG_GroupName',       st.getRange(5,  2));
    ss.setNamedRange('CFG_SpocName',        st.getRange(6,  2));
    ss.setNamedRange('CFG_MaxReminders',    st.getRange(11, 2));
    ss.setNamedRange('CFG_ScheduleDays',    st.getRange(13, 2));

    // Members
    const m = S.members;
    ss.setNamedRange('MBR_Names',     m.getRange('B4:B200'));
    ss.setNamedRange('MBR_AllData',   m.getRange('A4:I200'));
    ss.setNamedRange('MBR_Mobiles',   m.getRange('C4:C200'));
    ss.setNamedRange('MBR_Emails',    m.getRange('D4:D200'));
    ss.setNamedRange('MBR_OptIn',     m.getRange('E4:E200'));
    ss.setNamedRange('MBR_Platforms', m.getRange('F4:F200'));
    ss.setNamedRange('MBR_Active',    m.getRange('G4:G200'));

    // Schedule
    const sc = S.schedule;
    ss.setNamedRange('SCH_AllData',   sc.getRange('A4:H100'));
    ss.setNamedRange('SCH_Dates',     sc.getRange('A4:A100'));
    ss.setNamedRange('SCH_Assigned',  sc.getRange('C4:C100'));
    ss.setNamedRange('SCH_Backup',    sc.getRange('D4:D100'));
    ss.setNamedRange('SCH_Status',    sc.getRange('F4:F100'));
    ss.setNamedRange('SCH_CompletedAt', sc.getRange('G4:G100'));

    Logger.log('✅  Named ranges created');
  } catch (e) {
    Logger.log('⚠️  Named ranges warning: ' + e.toString());
  }
}


// ═══════════════════════════════════════════════════════════════════════
//  MENU ACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/** Marks today's schedule row as Completed. */
function markTodayCompleted() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const scSheet = ss.getSheetByName('📅 Schedule');
  const ui      = SpreadsheetApp.getUi();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dates = scSheet.getRange(4, 1, 60, 1).getValues();
  let   found = -1;

  for (let i = 0; i < dates.length; i++) {
    if (!dates[i][0]) continue;
    const d = new Date(dates[i][0]); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) { found = 4 + i; break; }
  }

  if (found < 0) {
    ui.alert("⚠️  Today's date was not found in the schedule.\nThe schedule may need to be refreshed from Settings.");
    return;
  }

  scSheet.getRange(found, 6).setValue('Completed');
  scSheet.getRange(found, 7).setValue(new Date());

  const member = scSheet.getRange(found, 3).getValue();
  ui.alert(`✅  Marked as Completed!\n\nAssigned Member: ${member}\nCompleted At: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy, HH:mm')}`);
}

/** Regenerates the schedule from Settings, preserving past completions. */
function refreshSchedule() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const ui      = SpreadsheetApp.getUi();
  const stSheet = ss.getSheetByName('⚙️ Settings');
  const scSheet = ss.getSheetByName('📅 Schedule');

  const resp = ui.alert(
    '🔄  Refresh Schedule',
    'This will regenerate the 30-day schedule using current Settings values.\n\n' +
    'Past "Completed" entries will be preserved. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  const startDateRaw    = stSheet.getRange(8,  2).getValue();
  const enableWeekends  = stSheet.getRange(12, 2).getValue();
  const scheduleDays    = parseInt(stSheet.getRange(13, 2).getValue()) || 30;

  const startDate = new Date(startDateRaw);
  const incWeekends = enableWeekends === true || enableWeekends === 'TRUE';

  // Save completed rows
  const existing = scSheet.getRange(4, 1, 60, 8).getValues();
  const done = {};
  existing.forEach(row => {
    if (row[0] && row[5] === 'Completed') {
      const k = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      done[k] = { at: row[6], remarks: row[7] };
    }
  });

  const schedule = _generateSchedule(startDate, scheduleDays, incWeekends);

  scSheet.getRange(4, 1, 70, 8).clearContent();

  const data = schedule.map(r => {
    const k  = Utilities.formatDate(r.date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const ex = done[k];
    return [r.date, r.dayName, r.assigned, r.backup, r.category,
            ex ? 'Completed' : 'Pending',
            ex ? ex.at      : '',
            ex ? ex.remarks : ''];
  });
  scSheet.getRange(4, 1, data.length, 8).setValues(data);
  scSheet.getRange(4, 1, data.length, 1).setNumberFormat('dd/mm/yyyy');

  ui.alert('✅  Schedule refreshed successfully!');
}

/** Forces a dashboard recalculation. */
function updateDashboard() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅  Dashboard updated!');
}

/** Manually syncs all existing form responses to the Members sheet. */
function syncFormResponses() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const ui  = SpreadsheetApp.getUi();

  // Try "Form Responses 1" first, then the configured name
  const stSheet    = ss.getSheetByName('⚙️ Settings');
  const sheetName  = stSheet ? stSheet.getRange(17, 2).getValue() : 'Form Responses 1';
  const respSheet  = ss.getSheetByName(sheetName) || ss.getSheetByName('Form Responses 1');

  if (!respSheet) {
    ui.alert('No form responses found yet.\nShare the registration form with members to start collecting responses.');
    return;
  }

  const rows  = respSheet.getDataRange().getValues().slice(1); // skip header
  let count   = 0;

  rows.forEach(row => {
    if (!row[1]) return;
    const fakeEvent = {
      namedValues: {
        'Full Name'                                          : [String(row[1])],
        'Mobile Number (with country code)'                  : [String(row[2] || '')],
        'Email Address'                                      : [String(row[3] || '')],
        'Would you like to receive automated reminders?'     : [String(row[4] || 'No')],
        'Preferred Reminder Platform'                        : [String(row[5] || 'None')],
        'Any Additional Remarks or Suggestions'              : [String(row[7] || '')],
      }
    };
    onFormSubmit(fakeEvent);
    count++;
  });

  ui.alert(`✅  Sync complete! Processed ${count} form response(s).`);
}

/** Shows system info dialog. */
function showAbout() {
  SpreadsheetApp.getUi().alert(
    'ℹ️  About StudySync',
    'StudySync – MBA Study Group Management System\n\n' +
    'Version  : 1.0.0\n' +
    'Phase    : 1 – Foundation\n' +
    'SPoC     : Shreyas Mahendra Thakur\n' +
    'GitHub   : github.com/ShreyasThakur11\n\n' +
    'Built with Google Apps Script.\n' +
    'No third-party services are required in Phase 1.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


// ═══════════════════════════════════════════════════════════════════════
//  HELPERS — formatting utilities
// ═══════════════════════════════════════════════════════════════════════

function _mergeTitle(sh, row, col, rows, cols, text, bg, fontSize, rowHeight) {
  sh.getRange(row, col, rows, cols).merge()
    .setValue(text)
    .setBackground(bg).setFontColor(CONFIG.C.WHITE)
    .setFontSize(fontSize).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(row, rowHeight);
}

function _mergeSubtitle(sh, row, col, rows, cols, text, bg, color) {
  sh.getRange(row, col, rows, cols).merge()
    .setValue(text)
    .setBackground(bg).setFontColor(color)
    .setFontStyle('italic').setHorizontalAlignment('center')
    .setFontSize(10).setVerticalAlignment('middle');
  sh.setRowHeight(row, 24);
}

function _writeRow(sh, row, startCol, values, bg, textColor, bold, fontSize, rowHeight) {
  sh.getRange(row, startCol, 1, values.length)
    .setValues([values])
    .setBackground(bg).setFontColor(textColor)
    .setFontWeight(bold ? 'bold' : 'normal')
    .setFontSize(fontSize || 10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(row, rowHeight || 28);
}

function _cfText(sh, startRow, col, numRows, text, bg, color) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text)
    .setBackground(bg).setFontColor(color)
    .setRanges([sh.getRange(startRow, col, numRows, 1)])
    .build();
}
