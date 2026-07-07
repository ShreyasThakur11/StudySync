# 📚 StudySync — MBA Study Group Management System

> 🌐 **Live Web Portal**: **[shreyasthakur11.github.io/StudySync](https://shreyasthakur11.github.io/StudySync/)**  
> Browse live business and technology news feeds, format them instantly with one click, and copy the post to share in your study groups.

---

## 📋 Overview

StudySync is a professional, formula-driven study group management system built entirely on Google Workspace. It organizes daily news-posting responsibilities, maintains member information, and collects automation consent — all ready for Phase 2 automation without any structural changes.

**15 members · 30-day rotating schedule · Each member posts exactly twice**

---

## 🚀 Quick Setup (5 minutes)

### Step 1 — Open Google Apps Script

1. Go to **[script.google.com](https://script.google.com)**
2. Click **"New project"**
3. Name it **`StudySync`**

### Step 2 — Paste the Script

1. Delete all existing code in `Code.gs`
2. Open [`apps-script/StudySync.gs`](apps-script/StudySync.gs) from this repo
3. Copy the entire content
4. Paste it into the Apps Script editor

### Step 3 — Run the Setup

1. In the toolbar, select function **`createStudySyncSystem`**
2. Click **▶ Run**
3. Click **"Review Permissions"** → **"Allow"** when prompted
4. Wait approximately **60–90 seconds**

### Step 4 — Find Your Files

1. Open the **Execution Log** (View → Logs)
2. Copy the **Spreadsheet URL** and **Form URL** from the log
3. Both files are also saved to your **Google Drive root**

### Step 5 — Share with Members

1. Share the **Spreadsheet** with your group (Viewer access for most, Editor for SPoC)
2. Share the **Form URL** with all 15 members for onboarding

---

## 📊 Spreadsheet Structure

| Sheet | Tab Color | Purpose |
|-------|-----------|---------|
| 📊 Dashboard | Blue | Real-time KPIs, today's assignment, upcoming schedule |
| 👥 Members | Green | Member directory with contact info and preferences |
| 📅 Schedule | Amber | 30-day rotating schedule with status tracking |
| 📰 News Sources | Teal | 55+ curated resources organized by 14 categories |
| ⚙️ Settings | Purple | System configuration — edit here, automation reads here |
| 📖 Instructions | Gray | User guide covering all features |

---

## 🧩 Features

### Members Sheet
- Pre-populated with all 15 member names
- Dropdowns: Automation Opt-In (Yes/No), Platform (WhatsApp/Telegram/Email/None), Active (TRUE/FALSE)
- Green/Red conditional formatting for opt-in and active status
- Frozen headers, alternating rows, protected ID column

### Schedule Sheet
- Auto-generated 30-day rotation (each of 15 members appears exactly twice)
- Weekends excluded by default (configurable)
- Today's row highlighted in amber with bold border
- Status dropdown: Pending / Completed / Missed / Reassigned
- Color-coded status: Green = Completed, Yellow = Pending, Red = Missed, Blue = Reassigned

### Dashboard
- **Today's Assignment** — live lookup from schedule
- **Tomorrow's Assignment** — always one step ahead
- **5 KPI tiles**: Total Members, Active, Completed, Pending, Missed
- **Completion Rate** — auto-calculated percentage
- **Upcoming 7-Day Table** — next week at a glance
- **Member Participation Tracker** — per-member completion breakdown

### News Sources
- 55+ curated resources across 14 categories
- Categories: Business, Economics, Finance, Markets, Technology/AI, Strategy, Consulting, Operations, Supply Chain, ESG, Startups, Leadership, Indian Economy, Global Economy, Government Policy, Manufacturing
- Priority rating with color coding (High/Medium/Low)
- Suggested reading time per source

### Settings Sheet
- Central configuration for all system parameters
- All Phase 2 automation settings pre-populated (reminder time, interval, max reminders)
- Named ranges expose every setting to future automation scripts

---

## 📝 Google Form

**Title**: Study Group Automation Registration

**Fields**:
1. Full Name *(required)*
2. Mobile Number with country code *(required)*
3. Email Address *(required)*
4. Would you like automated reminders? — Yes / No *(required)*
5. Preferred Platform — WhatsApp / Telegram / Email / None *(required)*
6. Best Time for Reminder *(optional)*
7. Additional Remarks *(optional)*

**On submission**: The `onFormSubmit` trigger automatically finds the member by name (fuzzy match) and updates their row in the Members sheet. No duplicates are created.

---

## 🤖 Custom Menu (StudySync Menu)

After setup, a **📚 StudySync** menu appears in the spreadsheet toolbar:

| Menu Item | Action |
|-----------|--------|
| ✅ Mark Today as Completed | One-click completion for today's assignment |
| 🔄 Refresh Schedule | Regenerates schedule from Settings (preserves completions) |
| 📊 Update Dashboard | Forces dashboard recalculation |
| 🔁 Sync Form Responses | Manually syncs all form responses to Members sheet |
| ℹ️ About StudySync | Shows system info |

---

## 🔐 Named Ranges (Phase 2 API)

The system exposes all key ranges as named ranges so Phase 2 automation can read without hardcoding:

| Named Range | Points To |
|-------------|-----------|
| `CFG_StartDate` | Settings → Schedule Start Date |
| `CFG_EnableWeekends` | Settings → Enable Weekends |
| `CFG_ReminderTime` | Settings → Reminder Time |
| `CFG_GroupName` | Settings → Study Group Name |
| `CFG_SpocName` | Settings → SPoC Name |
| `MBR_Names` | Members → All Names (B4:B200) |
| `MBR_AllData` | Members → Full data block |
| `MBR_Mobiles` | Members → Mobile Numbers |
| `MBR_Emails` | Members → Email Addresses |
| `MBR_OptIn` | Members → Automation Opt-In column |
| `MBR_Platforms` | Members → Preferred Platform column |
| `SCH_AllData` | Schedule → Full data block |
| `SCH_Dates` | Schedule → Date column |
| `SCH_Assigned` | Schedule → Assigned Member column |
| `SCH_Status` | Schedule → Status column |

---

## 🔮 Phase 2 Integration Guide

See [`docs/automation-integration-guide.md`](docs/automation-integration-guide.md) for a detailed Phase 2 plan.

**TL;DR**: Phase 2 automation will:
- Read `CFG_ReminderTime` and `MBR_OptIn` to decide who to notify and when
- Read `SCH_Assigned` to find today's member
- Read `MBR_Mobiles`/`MBR_Emails`/`MBR_Platforms` to send the reminder
- Update `SCH_Status` after confirmation
- Zero structural changes to the spreadsheet required

---

## 📁 Repository Structure

```
StudySync/
├── index.html                         ← Web Portal index page (GitHub Pages)
├── style.css                          ← Glassmorphism portal styles
├── app.js                             ← RSS feed parser & scheduler logic
├── README.md                          ← You are here
├── apps-script/
│   ├── StudySync.gs                   ← Phase 1 Spreadsheet Setup script
│   └── Reminders.gs                   ← Phase 2 Daily Reminders & Triggers
└── docs/
    ├── setup-guide.md                 ← Step-by-step setup guide
    ├── sheet-structure.md             ← Detailed sheet documentation
    └── automation-integration-guide.md ← Phase 2 planning & integration guide
```

---

## 👤 About

**SPoC**: Shreyas Mahendra Thakur  
**Group**: MBA Study Group (15 members)  
**GitHub**: [@ShreyasThakur11](https://github.com/ShreyasThakur11)  
**Version**: 1.0.0 · Phase 1 – Foundation  

---

*Built with ❤️ using Google Apps Script — no external services, no subscriptions, no dependencies.*
