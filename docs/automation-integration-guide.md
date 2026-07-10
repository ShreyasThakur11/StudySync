# Phase 2 Automation Integration Guide

> StudySync · Version 2.0 Planning & Implementation Document  
> **Status: Implemented**  
> The core automation is now fully implemented in [Reminders.gs](../apps-script/Reminders.gs).

---

## Overview

Phase 2 adds automated daily reminders to the StudySync system. **No changes to the spreadsheet structure are required.** The automation reads everything it needs from pre-established Named Ranges and Settings.

---

## What Phase 2 Will Do

1. **Daily trigger** fires at the time in `CFG_ReminderTime`
2. Reads today's assigned member from `SCH_Assigned` (matched by today's date in `SCH_Dates`)
3. Looks up the member's contact details in `MBR_AllData` using their name
4. Checks `MBR_OptIn` - only messages members who opted in
5. Sends reminder via the member's `MBR_Platforms` preference
6. If status is not updated to "Completed" by evening, sends a follow-up
7. Weekly summary report to all members

---

## Named Ranges Reference (Phase 2 reads these)

```javascript
// Read today's assigned member
const schedSheet = ss.getRangeByName('SCH_Dates');
// ... find today's row, then get SCH_Assigned at that row

// Read member contact info
const allMembers = ss.getRangeByName('MBR_AllData').getValues();
// Columns: [ID, Name, Mobile, Email, OptIn, Platform, Active, DateJoined, Remarks]
//           [0]  [1]   [2]     [3]    [4]    [5]       [6]    [7]          [8]

// Read configuration
const reminderTime = ss.getRangeByName('CFG_ReminderTime').getValue(); // "08:00"
const groupName    = ss.getRangeByName('CFG_GroupName').getValue();
const maxReminders = ss.getRangeByName('CFG_MaxReminders').getValue(); // 3
```

---

## Suggested Phase 2 Architecture

### Option A - Google Apps Script + Gmail

```javascript
// apps-script/Reminders.gs (NEW file, add to same project)

function sendDailyReminder() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const today   = new Date();

  // 1. Find today's assignment
  const schedData = ss.getRangeByName('SCH_AllData').getValues();
  const todayRow  = schedData.find(row => {
    const d = new Date(row[0]); d.setHours(0,0,0,0);
    const t = new Date(today);  t.setHours(0,0,0,0);
    return d.getTime() === t.getTime();
  });

  if (!todayRow || todayRow[5] === 'Completed') return; // Already done

  const assignedName = todayRow[2]; // Column C

  // 2. Find member contact info
  const members = ss.getRangeByName('MBR_AllData').getValues();
  const member  = members.find(m =>
    m[1].toString().trim().toLowerCase() === assignedName.toLowerCase()
    && m[4] === 'Yes'   // Opted in
    && m[6] === 'TRUE'  // Active
  );

  if (!member) return;

  const email    = member[3];
  const platform = member[5];
  const category = todayRow[4];

  // 3. Send reminder based on platform preference
  if (platform === 'Email' && email) {
    GmailApp.sendEmail(email, `📰 Study Group Reminder - ${Utilities.formatDate(today,'IST','dd MMM')}`,
      `Hi ${assignedName},\n\nThis is your reminder to post today's news.\n\nCategory: ${category}\n\nCheck the news sources sheet for curated resources.\n\nStudySync`
    );
  }
  // WhatsApp/Telegram: integrate via Twilio/Telegram Bot API
}
```

### Option B - WhatsApp via Twilio

```javascript
function sendWhatsAppReminder(to, message) {
  const TWILIO_SID   = PropertiesService.getScriptProperties().getProperty('TWILIO_SID');
  const TWILIO_TOKEN = PropertiesService.getScriptProperties().getProperty('TWILIO_TOKEN');
  const FROM_NUMBER  = 'whatsapp:+14155238886'; // Twilio sandbox

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const payload = {
    From: FROM_NUMBER,
    To  : `whatsapp:${to}`,
    Body: message,
  };

  UrlFetchApp.fetch(url, {
    method              : 'post',
    payload             : payload,
    headers             : {
      Authorization: 'Basic ' + Utilities.base64Encode(`${TWILIO_SID}:${TWILIO_TOKEN}`)
    },
    muteHttpExceptions  : true,
  });
}
```

### Option C - Telegram Bot

```javascript
function sendTelegramMessage(chatId, message) {
  const BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  const url       = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  UrlFetchApp.fetch(url, {
    method            : 'post',
    contentType       : 'application/json',
    payload           : JSON.stringify({ chat_id: chatId, text: message }),
    muteHttpExceptions: true,
  });
}
```

---

## Phase 2 Time-Based Trigger Setup

```javascript
function setupPhase2Triggers() {
  // Morning reminder
  ScriptApp.newTrigger('sendDailyReminder')
    .timeBased()
    .atHour(8)           // reads CFG_ReminderTime from settings
    .everyDays(1)
    .create();

  // Evening follow-up (if not completed)
  ScriptApp.newTrigger('sendEveningFollowUp')
    .timeBased()
    .atHour(19)
    .everyDays(1)
    .create();

  // Weekly summary (every Monday)
  ScriptApp.newTrigger('sendWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
}
```

---

## Completion Update via Automation

```javascript
// Mark today as completed programmatically (e.g., via webhook from WhatsApp)
function markCompletedByName(memberName) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const scSheet  = ss.getSheetByName('📅 Schedule');
  const today    = new Date(); today.setHours(0,0,0,0);

  const dates = scSheet.getRange(4, 1, 60, 1).getValues();
  for (let i = 0; i < dates.length; i++) {
    if (!dates[i][0]) continue;
    const d = new Date(dates[i][0]); d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime()) {
      scSheet.getRange(4 + i, 6).setValue('Completed');
      scSheet.getRange(4 + i, 7).setValue(new Date());
      return true;
    }
  }
  return false;
}
```

---

## Secrets Management

Store all API keys in **Script Properties** (never hardcode):

```javascript
// Set once via Apps Script editor: File → Project Properties → Script Properties
// Keys: TWILIO_SID, TWILIO_TOKEN, TELEGRAM_BOT_TOKEN
const props = PropertiesService.getScriptProperties();
```

---

## Phase 2 Checklist

- [x] Choose reminder platform (Email / WhatsApp / Telegram)
- [x] Set up platform credentials (Twilio or Telegram Bot)
- [x] Store credentials in Script Properties
- [x] Add `Reminders.gs` to the same Apps Script project
- [x] Run `setupPhase2Triggers()` once (or via custom spreadsheet menu)
- [x] Test with one member first (use 🧪 Test menu items)
- [ ] Gradually enable for all opted-in members

---

*No changes to the spreadsheet, sheets, columns, or formulas are required for Phase 2.*
