# StudySync Setup Guide

This guide takes you through the complete setup of the StudySync MBA Study Group Management system, covering both the Phase 1 spreadsheet generation and Phase 2 reminder automation.

---

## Step 1: Create the Google Apps Script Project

1. Go to **[script.google.com](https://script.google.com)** and log in with your Google account.
2. Click the **"New project"** button in the top left.
3. Rename the project from "Untitled project" to **`StudySync`** by clicking on the title.

---

## Step 2: Add the Script Files

Your Apps Script project needs two files:

### File 1: `Code.gs` (Phase 1 Core)
1. Select the default `Code.gs` file in the editor.
2. Delete any boilerplate code inside it.
3. Copy the entire contents of [apps-script/StudySync.gs](https://github.com/ShreyasThakur11/StudySync/blob/main/apps-script/StudySync.gs) from this repository.
4. Paste it into the editor.
5. Rename this file to `StudySync.gs` (optional, but recommended for clarity).

### File 2: `Reminders.gs` (Phase 2 Automation)
1. Click the **`+`** icon next to **Files** in the left sidebar and select **Script**.
2. Name the new file **`Reminders`** (it will auto-append `.gs`).
3. Copy the entire contents of [apps-script/Reminders.gs](https://github.com/ShreyasThakur11/StudySync/blob/main/apps-script/Reminders.gs) from this repository.
4. Paste it into the editor.
5. Save the project by clicking the **Save (💾 icon)** on the toolbar or pressing `Ctrl + S`.

---

## Step 3: Run the System Setup Generator

1. In the editor toolbar, select the function **`createStudySyncSystem`** from the dropdown menu.
2. Click **▶ Run**.
3. Google will prompt you to authorize permissions. Click **"Review Permissions"**, select your account, click **"Advanced"**, and then click **"Go to StudySync (unsafe)"** and **"Allow"**.
4. Wait approximately **60-90 seconds** while the script generates the spreadsheet, sheets, dashboard, form, triggers, and formulas.
5. Inspect the **Execution Log** at the bottom of the editor. You will see:
   - **Spreadsheet URL** (open and bookmark this).
   - **Form (share) URL** (send this to group members).
   - **Form (edit) URL** (keep this secure).

---

## Step 4: Configure Script Secrets (For WhatsApp & Telegram)

If you plan to use email notifications, no extra configuration is needed. If you want to use **WhatsApp (via Twilio)** or **Telegram Bots**, you must set up credentials:

1. In the Apps Script sidebar, click the **Project Settings (⚙️ icon)**.
2. Scroll down to the **Script Properties** section.
3. Click **"Add script property"** and add your credentials:

| Property Name | Value / Description |
|---|---|
| `TWILIO_SID` | Your Twilio Account SID |
| `TWILIO_TOKEN` | Your Twilio Auth Token |
| `TWILIO_FROM` | Twilio sandbox number (e.g., `whatsapp:+14155238886`) |
| `TELEGRAM_BOT_TOKEN` | Your HTTP API Bot Token from BotFather |
| `TELEGRAM_GROUP_CHAT_ID` | Group Chat ID (e.g., `-100xxxxxxxxx`) to send weekly summaries to |
| `WHATSAPP_GROUP_NUMBER` | Fallback WhatsApp group phone number to send summaries to |

4. Click **"Save script properties"**.

---

## Step 5: Activate Daily Triggers

Once members have registered and preferences are locked in:

1. Open your newly created **StudySync Spreadsheet**.
2. Wait a few seconds for the custom menu **`📚 StudySync`** to load in the top menu bar.
3. Click **`📚 StudySync`** -> **`🤖 Automation (Phase 2)`** -> **`🔔 Setup Automation Triggers`**.
4. This programmatically registers the background triggers in Google Workspace. You can check these by opening the **Triggers (⏰ icon)** tab in the Apps Script project editor.

---

## Step 6: Test Notifications

You can test notifications immediately without waiting for the scheduled times:

1. Open the spreadsheet custom menu **`📚 StudySync`** -> **`🤖 Automation (Phase 2)`**.
2. Select **`🧪 Test Morning Reminder`** to trigger a test daily reminder for today's assigned poster.
3. Select **`🧪 Test Evening Follow-up`** to test pending alerts.
4. Select **`🧪 Test Weekly Summary`** to test the Monday summary report email and group broadcasts.
