/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          StudySync – MBA Study Group Management System               ║
 * ║                    Version 2.0.0 | Phase 2                           ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  PHASE 2 AUTOMATION & REMINDERS                                      ║
 * ║  This script handles scheduling and sending daily reminders,         ║
 * ║  evening follow-ups, and weekly reports.                             ║
 * ║                                                                      ║
 * ║  SECRETS CONFIGURATION:                                              ║
 * ║  Store credentials in Script Properties via Apps Script Settings:    ║
 * ║  - TWILIO_SID          (Twilio account SID)                         ║
 * ║  - TWILIO_TOKEN        (Twilio auth token)                          ║
 * ║  - TWILIO_FROM         (Twilio sandbox whatsapp number, e.g.        ║
 * ║                         whatsapp:+14155238886)                      ║
 * ║  - TELEGRAM_BOT_TOKEN  (Telegram Bot Token from BotFather)           ║
 * ║  - TELEGRAM_GROUP_CHAT_ID (Fallback/Group Telegram chat ID)         ║
 * ║  - WHATSAPP_GROUP_NUMBER  (Fallback/Group WhatsApp number)          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════
//  AUTOMATION TRIGGER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Registers Phase 2 daily and weekly triggers.
 * Cleans up any existing StudySync reminder triggers first.
 */
function setupPhase2Triggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear any existing triggers first to avoid duplicates
  clearPhase2Triggers();
  
  // Read configured reminder time from settings (default "08:00")
  let reminderHour = 8;
  try {
    const reminderTimeStr = ss.getRangeByName('CFG_ReminderTime').getValue().toString();
    if (reminderTimeStr && reminderTimeStr.indexOf(':') > -1) {
      reminderHour = parseInt(reminderTimeStr.split(':')[0], 10);
    }
  } catch (e) {
    Logger.log('⚠️ Error reading CFG_ReminderTime settings, defaulting to 8:00 AM. ' + e.toString());
  }

  // 1. Morning Daily Reminder Trigger
  ScriptApp.newTrigger('sendDailyReminder')
    .timeBased()
    .everyDays(1)
    .atHour(reminderHour)
    .create();

  // 2. Evening Daily Follow-Up Trigger (Fixed at 7:00 PM / 19:00)
  ScriptApp.newTrigger('sendEveningFollowUp')
    .timeBased()
    .everyDays(1)
    .atHour(19)
    .create();

  // 3. Weekly Activity Summary Trigger (Runs Mondays at 9:00 AM)
  ScriptApp.newTrigger('sendWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  _safeAlert(
    '✅ Automation Active',
    `StudySync Phase 2 triggers successfully registered:\n\n` +
    `☀️ Morning Reminder: Daily in the ${reminderHour}:00 to ${reminderHour + 1}:00 window\n` +
    `🌙 Evening Follow-up: Daily in the 19:00 to 20:00 window\n` +
    `📊 Weekly Summary: Mondays between 09:00 and 10:00 AM`
  );
}

/**
 * Removes all active StudySync automation triggers to halt notifications.
 */
function clearPhase2Triggers() {
  const targetHandlers = ['sendDailyReminder', 'sendEveningFollowUp', 'sendWeeklySummary'];
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;
  
  triggers.forEach(t => {
    if (targetHandlers.indexOf(t.getHandlerFunction()) > -1) {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });

  Logger.log(`Removed ${count} active automation trigger(s).`);
  if (count > 0) {
    _safeAlert('🚫 Triggers Cleared', `Successfully deactivated ${count} StudySync automation trigger(s).`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  DAILY REMINDER MODULES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Checks today's schedule assignment and sends a custom morning reminder.
 */
function sendDailyReminder() {
  Logger.log('☀️ Running morning daily reminder check...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  
  // 1. Get today's scheduled member details
  const assignment = _getAssignedMemberDetails(ss, today);
  if (!assignment) {
    Logger.log('ℹ️ No schedule assignment found for today.');
    return;
  }
  
  const { name, dateStr, category, status, backupName } = assignment;
  Logger.log(`Today's assignment: Name = ${name}, Status = ${status}, Category = ${category}`);
  
  // Stop if today's assignment is already marked completed
  if (status === 'Completed') {
    Logger.log(`✅ Today's posting by ${name} is already marked as Completed. No reminder needed.`);
    return;
  }
  
  // 2. Fetch member contact details
  const member = _getMemberDetails(ss, name);
  if (!member) {
    Logger.log(`⚠️ Member contact details not found for name: ${name}`);
    return;
  }
  
  const { mobile, email, optIn, platform, active, remarks } = member;
  
  if (active !== 'TRUE') {
    Logger.log(`ℹ️ Assigned member ${name} is currently set to Inactive. Skipping reminder.`);
    return;
  }
  
  if (optIn !== 'Yes') {
    Logger.log(`ℹ️ Assigned member ${name} has opted out of automated reminders. Skipping reminder.`);
    return;
  }
  
  // 3. Compose and distribute the reminder message
  const groupName = ss.getRangeByName('CFG_GroupName').getValue();
  const spocName = ss.getRangeByName('CFG_SpocName').getValue();
  
  const message = 
    `📚 *StudySync Reminder — ${dateStr}*\n\n` +
    `Hi *${name}*,\n\n` +
    `You are the primary poster today for the *${groupName}*.\n\n` +
    `▪️ *Category:* ${category}\n` +
    `▪️ *Date:* ${dateStr}\n` +
    `▪️ *Backup Poster:* ${backupName || 'None'}\n\n` +
    `Please refer to the *📰 News Sources* tab in your StudySync spreadsheet for resources. Once you have posted the daily summary to the group, please mark it as *Completed* using the custom menu.\n\n` +
    `Thank you!\n` +
    `— StudySync System (SPoC: ${spocName})`;

  let sent = false;
  
  if (platform === 'Email' && email) {
    sent = _sendEmailReminder(email, `📰 StudySync Daily Reminder — ${dateStr}`, message);
  } else if (platform === 'WhatsApp' && mobile) {
    sent = _sendWhatsAppReminder(mobile, message);
  } else if (platform === 'Telegram') {
    const telegramChatId = _extractTelegramChatId(remarks) || PropertiesService.getScriptProperties().getProperty('TELEGRAM_GROUP_CHAT_ID');
    if (telegramChatId) {
      sent = _sendTelegramReminder(telegramChatId, message);
    } else {
      Logger.log(`⚠️ No Telegram Chat ID specified in Remarks for ${name}. Falling back to Email.`);
      if (email) {
        sent = _sendEmailReminder(email, `📰 StudySync Daily Reminder — ${dateStr}`, message);
      }
    }
  } else {
    Logger.log(`⚠️ Platform preference '${platform}' not fully configured or lacks contact details for ${name}.`);
  }
  
  if (sent) {
    Logger.log(`✅ Morning reminder successfully sent to ${name} via ${platform}.`);
  } else {
    Logger.log(`❌ Failed to send daily reminder to ${name} via ${platform}.`);
  }
}

/**
 * Checks today's schedule and issues a follow-up warning if posting remains pending.
 */
function sendEveningFollowUp() {
  Logger.log('🌙 Running evening follow-up check...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  
  // 1. Get today's scheduled member details
  const assignment = _getAssignedMemberDetails(ss, today);
  if (!assignment) return;
  
  const { name, dateStr, category, status } = assignment;
  
  // Verify if it is pending (or reassigned, but not Completed/Missed)
  if (status === 'Completed' || status === 'Missed') {
    Logger.log(`ℹ️ Today's posting status is '${status}'. No evening follow-up required.`);
    return;
  }
  
  // 2. Fetch member contact details
  const member = _getMemberDetails(ss, name);
  if (!member || member.active !== 'TRUE' || member.optIn !== 'Yes') {
    Logger.log(`ℹ️ Member ${name} is inactive or has opted out. Skipping follow-up.`);
    return;
  }
  
  const { mobile, email, platform, remarks } = member;
  const groupName = ss.getRangeByName('CFG_GroupName').getValue();
  const spocName = ss.getRangeByName('CFG_SpocName').getValue();
  
  const message = 
    `⚠️ *StudySync Urgent Follow-Up*\n\n` +
    `Hi *${name}*,\n\n` +
    `Today's news posting assignment for *${groupName}* is still marked as *Pending*.\n\n` +
    `▪️ *Category:* ${category}\n` +
    `▪️ *Status:* Pending\n\n` +
    `Please share today's news updates in the study group and mark this task as *Completed*.\n\n` +
    `If you run into issues or cannot post, please contact your Backup member or SPoC *${spocName}* immediately.\n\n` +
    `Thank you!\n` +
    `— StudySync System`;

  let sent = false;
  
  if (platform === 'Email' && email) {
    sent = _sendEmailReminder(email, `⚠️ StudySync Follow-Up — News Posting Pending`, message);
  } else if (platform === 'WhatsApp' && mobile) {
    sent = _sendWhatsAppReminder(mobile, message);
  } else if (platform === 'Telegram') {
    const telegramChatId = _extractTelegramChatId(remarks) || PropertiesService.getScriptProperties().getProperty('TELEGRAM_GROUP_CHAT_ID');
    if (telegramChatId) {
      sent = _sendTelegramReminder(telegramChatId, message);
    } else if (email) {
      sent = _sendEmailReminder(email, `⚠️ StudySync Follow-Up — News Posting Pending`, message);
    }
  }
  
  if (sent) {
    Logger.log(`✅ Evening follow-up successfully sent to ${name} via ${platform}.`);
  } else {
    Logger.log(`❌ Failed to send evening follow-up to ${name}.`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  WEEKLY ACTIVITY SUMMARY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Summarizes the past week's posting activities and sends report to the SPoC/Group.
 */
function sendWeeklySummary() {
  Logger.log('📊 Generating weekly summary report...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  
  const schedRange = ss.getRangeByName('SCH_AllData');
  if (!schedRange) {
    Logger.log('❌ Error: SCH_AllData named range not found.');
    return;
  }
  
  const schedData = schedRange.getValues();
  const timeZone = Session.getScriptTimeZone();
  
  // Calculate range for the past 7 days (last Monday to last Sunday)
  const oneDayMs = 864e5;
  const startOfWeek = new Date(today.getTime() - 7 * oneDayMs);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today.getTime() - 1 * oneDayMs);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const startStr = Utilities.formatDate(startOfWeek, timeZone, 'dd MMM yyyy');
  const endStr = Utilities.formatDate(endOfWeek, timeZone, 'dd MMM yyyy');
  
  let total = 0, completed = 0, missed = 0, pending = 0, reassigned = 0;
  const listItems = [];
  
  schedData.forEach(row => {
    if (!row[0]) return;
    const rowDate = new Date(row[0]);
    if (rowDate >= startOfWeek && rowDate <= endOfWeek) {
      total++;
      const dateLabel = Utilities.formatDate(rowDate, timeZone, 'dd MMM (EEE)');
      const name = row[2];
      const status = row[5];
      
      if (status === 'Completed') completed++;
      else if (status === 'Missed') missed++;
      else if (status === 'Pending') pending++;
      else if (status === 'Reassigned') reassigned++;
      
      listItems.push(`▪️ *${dateLabel}:* ${name} — *${status}*`);
    }
  });
  
  if (total === 0) {
    Logger.log('ℹ️ No schedule assignments found in the past week to summarize.');
    return;
  }
  
  const completionRate = ((completed / total) * 100).toFixed(1);
  const groupName = ss.getRangeByName('CFG_GroupName').getValue();
  const spoc = _getSpocDetails(ss);
  
  const reportBody = 
    `📊 *StudySync Weekly Activity Report*\n` +
    `*Period:* ${startStr} – ${endStr}\n` +
    `*Group:* ${groupName}\n\n` +
    `📈 *Completion Performance:* ${completionRate}%\n` +
    `▫️ Total Days Scheduled: ${total}\n` +
    `▫️ Completed Postings: ${completed}\n` +
    `▫️ Missed Postings: ${missed}\n` +
    `▫️ Pending Postings: ${pending}\n` +
    `▫️ Reassigned Days: ${reassigned}\n\n` +
    `📅 *Daily Status Log:*\n` +
    listItems.join('\n') + `\n\n` +
    `Great work study group! Let's keep the streak going.\n` +
    `— StudySync Automation`;

  // 1. Email Report to the SPoC
  if (spoc && spoc.email) {
    _sendEmailReminder(spoc.email, `📊 StudySync Weekly Summary — ${groupName}`, reportBody);
    Logger.log(`Sent weekly report email to SPoC: ${spoc.name} (${spoc.email})`);
  } else {
    Logger.log('⚠️ SPoC email details missing. Skipping SPoC email delivery.');
  }
  
  // 2. Broadcast to fallbacks (e.g. Group Chat ID if configured in Script Properties)
  const props = PropertiesService.getScriptProperties();
  const tgGroup = props.getProperty('TELEGRAM_GROUP_CHAT_ID');
  const waGroup = props.getProperty('WHATSAPP_GROUP_NUMBER');
  
  if (tgGroup) {
    _sendTelegramReminder(tgGroup, reportBody);
    Logger.log('Sent weekly summary report to Telegram Group.');
  }
  if (waGroup) {
    _sendWhatsAppReminder(waGroup, reportBody);
    Logger.log('Sent weekly summary report to WhatsApp Group.');
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  THIRD-PARTY NOTIFICATION INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Dispatches an email using the Google Workspace Gmail service.
 */
function _sendEmailReminder(to, subject, markdownBody) {
  try {
    // Strip markdown formatting for cleaner plain-text representation in email client
    const plainText = markdownBody
      .replace(/\*/g, '')
      .replace(/▪️/g, '•')
      .replace(/▫️/g, '-');
      
    GmailApp.sendEmail(to, subject, plainText);
    return true;
  } catch (e) {
    Logger.log(`❌ Error sending email to ${to}: ${e.toString()}`);
    return false;
  }
}

/**
 * Sends a WhatsApp notification using Twilio REST API.
 */
function _sendWhatsAppReminder(to, message) {
  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_SID');
  const token = props.getProperty('TWILIO_TOKEN');
  const fromNum = props.getProperty('TWILIO_FROM') || 'whatsapp:+14155238886'; // default Twilio sandbox number

  if (!sid || !token) {
    Logger.log('⚠️ Twilio credentials missing in Script Properties (TWILIO_SID, TWILIO_TOKEN). Skipping WhatsApp.');
    return false;
  }

  // Ensure 'to' number contains whatsapp prefix
  let target = to.trim();
  if (target.indexOf('whatsapp:') !== 0) {
    // Strip any leading spaces or symbols but keep '+' if present, formatting correctly
    const digitsOnly = target.replace(/[^+\d]/g, '');
    target = `whatsapp:${digitsOnly}`;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const payload = {
    From: fromNum,
    To: target,
    Body: message
  };

  const options = {
    method: 'post',
    payload: payload,
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(`${sid}:${token}`)
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const resText = response.getContentText();
    
    if (code === 200 || code === 201) {
      return true;
    } else {
      Logger.log(`❌ Twilio API Error (Status ${code}): ${resText}`);
      return false;
    }
  } catch (e) {
    Logger.log(`❌ Network error while calling Twilio API: ${e.toString()}`);
    return false;
  }
}

/**
 * Sends a Telegram notification using Telegram Bot API.
 */
function _sendTelegramReminder(chatId, message) {
  const botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    Logger.log('⚠️ Telegram Token missing in Script Properties (TELEGRAM_BOT_TOKEN). Skipping Telegram.');
    return false;
  }

  // Adjust formatting slightly to conform to Telegram's MarkdownV2 or Markdown styles
  // We will send message formatted using standard Telegram Markdown
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId.trim(),
    text: message,
    parse_mode: 'Markdown'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const resText = response.getContentText();
    
    if (code === 200) {
      return true;
    } else {
      Logger.log(`❌ Telegram API Error (Status ${code}): ${resText}`);
      return false;
    }
  } catch (e) {
    Logger.log(`❌ Network error calling Telegram Bot API: ${e.toString()}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  DATABASE LOOKUPS & UTILITIES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extracts a Telegram chat ID from a remarks field formatted like `telegram:123456789`.
 */
function _extractTelegramChatId(remarks) {
  if (!remarks) return null;
  const match = remarks.toString().match(/telegram(?:_chat_id)?:\s*(-?\d+)/i);
  return match ? match[1] : null;
}

/**
 * Looks up schedule assignment by checking date.
 */
function _getAssignedMemberDetails(ss, targetDate) {
  const datesRange = ss.getRangeByName('SCH_Dates');
  const allRange = ss.getRangeByName('SCH_AllData');
  if (!datesRange || !allRange) return null;

  const dates = datesRange.getValues();
  const allData = allRange.getValues();
  const timeZone = Session.getScriptTimeZone();
  
  // Format check strings (yyyy-MM-dd) to compare dates without time drift
  const targetKey = Utilities.formatDate(targetDate, timeZone, 'yyyy-MM-dd');

  for (let i = 0; i < dates.length; i++) {
    if (!dates[i][0]) continue;
    const dateObj = new Date(dates[i][0]);
    const currentKey = Utilities.formatDate(dateObj, timeZone, 'yyyy-MM-dd');
    
    if (currentKey === targetKey) {
      const row = allData[i];
      return {
        date: row[0],
        dateStr: Utilities.formatDate(dateObj, timeZone, 'dd MMM yyyy'),
        dayName: row[1],
        name: row[2],
        backupName: row[3],
        category: row[4],
        status: row[5]
      };
    }
  }
  return null;
}

/**
 * Looks up member contact and config values.
 */
function _getMemberDetails(ss, memberName) {
  const mRange = ss.getRangeByName('MBR_AllData');
  if (!mRange) return null;

  const members = mRange.getValues();
  const nameQuery = memberName.toString().trim().toLowerCase();

  for (let i = 0; i < members.length; i++) {
    const nameCell = members[i][1].toString().trim().toLowerCase();
    if (!nameCell) continue;
    
    // Support fuzzy matches similar to onboarding form sync
    if (nameCell === nameQuery || nameCell.indexOf(nameQuery) > -1 || nameQuery.indexOf(nameCell) > -1) {
      const r = members[i];
      return {
        id: r[0],
        name: r[1],
        mobile: r[2],
        email: r[3],
        optIn: r[4],
        platform: r[5],
        active: String(r[6]).toUpperCase(),
        dateJoined: r[7],
        remarks: r[8]
      };
    }
  }
  return null;
}

/**
 * Resolves SPoC details dynamically from the Settings and Members tab.
 */
function _getSpocDetails(ss) {
  try {
    const spocName = ss.getRangeByName('CFG_SpocName').getValue();
    if (spocName) {
      return _getMemberDetails(ss, spocName);
    }
  } catch (e) {
    Logger.log('⚠️ Failed to load SPoC details: ' + e.toString());
  }
  return null;
}

/**
 * Safely outputs alert to editor/spreadsheet, avoiding trigger execution crashes.
 */
function _safeAlert(title, message) {
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert(title, message, ui.ButtonSet.OK);
    }
  } catch (e) {
    Logger.log(`📢 [ALERT] ${title} : ${message}`);
  }
}
