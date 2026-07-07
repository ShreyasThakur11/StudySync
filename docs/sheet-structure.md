# 📐 Sheet Structure Reference

> StudySync v1.0 · Detailed column-by-column documentation

---

## 👥 Members Sheet

| Col | Header | Type | Validation | Notes |
|-----|--------|------|------------|-------|
| A | Member ID | Text | None | Format: M001–M015. Do not change. |
| B | Full Name | Text | None | Pre-populated. Match exactly for form sync. |
| C | Mobile Number | Text | None | Populated via form or manual entry |
| D | Email Address | Text | None | Populated via form or manual entry |
| E | Automation Opt-In | Dropdown | Yes / No | Required for Phase 2 reminders |
| F | Preferred Platform | Dropdown | WhatsApp / Telegram / Email / None | Used by Phase 2 |
| G | Active Member | Dropdown | TRUE / FALSE | Set FALSE if member leaves group |
| H | Date Joined | Date | None | Auto-filled on setup |
| I | Remarks | Text | None | Free text |

**Rows 1–2**: Title/subtitle (do not edit)  
**Row 3**: Column headers (frozen)  
**Rows 4–18**: Pre-populated member data  
**Rows 19+**: Reserved for new members  

---

## 📅 Schedule Sheet

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Date | Date | Format: dd/mm/yyyy |
| B | Day | Text | Monday–Friday |
| C | Assigned Member | Text | Primary poster for the day |
| D | Backup Member | Text | Next in rotation — covers if primary cannot post |
| E | News Category | Text | Rotating category assignment |
| F | Status | Dropdown | **Pending** / **Completed** / **Missed** / **Reassigned** |
| G | Completed At | DateTime | When the posting was marked complete |
| H | Remarks | Text | Notes on reassignment, issues etc. |

**Row 3**: Headers (frozen)  
**Rows 4–33**: 30-day schedule data  
**Today's row**: Highlighted amber, bold  
**Status colours**: Green=Completed, Yellow=Pending, Red=Missed, Blue=Reassigned  

---

## ⚙️ Settings Sheet

| Row | Parameter | Purpose |
|-----|-----------|---------|
| 5 | Study Group Name | Display name used across the system |
| 6 | SPoC Name | Shown in instructions and automation messages |
| 7 | Number of Members | Formula: auto-counts Members sheet |
| 8 | Schedule Start Date | **Editable** — change to regenerate schedule |
| 9 | Reminder Time | Phase 2: daily trigger time |
| 10 | Reminder Interval | Phase 2: days between reminders |
| 11 | Maximum Reminders | Phase 2: cap on follow-up messages |
| 12 | Enable Weekends | **Editable** — TRUE includes Sat/Sun in schedule |
| 13 | Schedule Days | Total days to generate (default 30) |
| 14 | Backup Member Enabled | Whether backup column is populated |
| 15 | News Categories | Comma-separated rotation list |
| 16 | WhatsApp Group Name | Phase 2: group to send summaries to |
| 17 | Form Response Sheet | Sheet name created by Google Form |
| 18 | System Version | Read-only |
| 19 | Phase | Read-only |
| 20 | Last Setup | Auto-populated timestamp |

---

## 📊 Dashboard Sheet

### Section 1 — Header (rows 1–2)
Static title + live refresh timestamp formula

### Section 2 — Assignment Cards (rows 4–7)
- Today's assignment: `MATCH(TODAY(), SCH_Dates)` → `INDEX(SCH_Assigned)`
- Tomorrow's assignment: `MATCH(TODAY()+1, SCH_Dates)` → `INDEX(SCH_Assigned)`

### Section 3 — KPI Tiles (rows 9–11)
- Total Members: `COUNTA(MBR_Names)`
- Active Members: `COUNTIF(MBR_Active, "TRUE")`
- Completed: `COUNTIF(SCH_Status, "Completed")`
- Pending: `COUNTIF(SCH_Status, "Pending")`
- Missed: `COUNTIF(SCH_Status, "Missed")`

### Section 4 — Completion Rate (rows 13–15)
Formula: `Completed / COUNTA(SCH_Status)` as percentage

### Section 5 — Upcoming 7 Days (rows 17–25)
Live references to Schedule rows 4–10

### Section 6 — Member Participation (rows 27+)
Per-member COUNTIFS across schedule data

---

## 📰 News Sources Sheet

| Col | Header | Notes |
|-----|--------|-------|
| A | Category | 14 category groups |
| B | Website / Source | Name + URL format |
| C | Description | Brief description |
| D | Priority | High / Medium / Low (dropdown) |
| E | Suggested Reading | Estimated time per source |

**55+ sources** across 14 categories  
Row background colours group by category  
Priority colour-coded: Green=High, Amber=Medium, Red=Low  

---

## 📖 Instructions Sheet

Single-column instruction guide with colour-coded sections:
- **Navy background** = Section header
- **White/Gray alternating** = Normal content
- **Light red background** = Warning notes
- **Light blue background** = Tips
- **Light amber background** = Important notes

---

## Named Ranges Quick Reference

```
CFG_* → ⚙️ Settings values
MBR_* → 👥 Members data
SCH_* → 📅 Schedule data
```

All named ranges start at row 4 (first data row) and extend to row 200/100 to accommodate growth.
