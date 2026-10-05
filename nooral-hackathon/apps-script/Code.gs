// Google Apps Script - HackVerse Hackathon Registration & Email Notification
// Copy and paste this script into Google Sheets: Extensions > Apps Script > Code.gs

const EVENT_NAME = "HackVerse Hackathon";
const EVENT_DATE = "1st November 2026, 9:00 AM – 6:00 PM";
const EVENT_LOCATION = "Satara";
const ORGANIZER_NAME = "Nooral.AI";
const CONTACT_EMAIL = "hr@nooral.ai";
const CONTACT_PHONES = "8485819119 / 9130159556";

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // Prevent concurrent write race conditions

    var data = JSON.parse(e.postData.contents);
    var record = data.record;
    var rowData = data.row;
    var headers = data.headers;
    var regId = record ? record.id : (rowData ? rowData[0] : null);
    var status = record ? record.status : (rowData ? rowData[1] : "");

    if (!rowData || !regId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Invalid payload: missing row or registration ID"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure header row exists (plus Email Sent header at column 42)
    if (sheet.getLastRow() === 0) {
      if (headers && headers.length > 0) {
        var hCopy = headers.slice();
        if (hCopy.indexOf("Email Sent") === -1) {
          hCopy.push("Email Sent");
        }
        sheet.appendRow(hCopy);
      }
    }

    var values = sheet.getDataRange().getValues();
    var existingRowIndex = -1;
    var emailSentStatus = "";

    // Search for existing Registration ID in Column A (skip header)
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(regId)) {
        existingRowIndex = i + 1; // 1-based index in Sheets
        if (values[i].length >= 42) {
          emailSentStatus = String(values[i][41]); // Column 42 (Email Sent)
        }
        break;
      }
    }

    var emailSentResult = false;

    // Send confirmation email ONLY if status is PAID and email has not been sent yet
    if (String(status).toLowerCase() === "paid" && emailSentStatus !== "SENT") {
      emailSentResult = sendConfirmationEmail(record);
    }

    var finalRow = rowData.slice();
    // Ensure row has 41 columns before appending Email Sent column
    while (finalRow.length < 41) {
      finalRow.push("");
    }
    finalRow[41] = (emailSentResult || emailSentStatus === "SENT") ? "SENT" : (emailSentStatus || "PENDING");

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex, 1, 1, finalRow.length).setValues([finalRow]);
    } else {
      sheet.appendRow(finalRow);
    }

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synced registration " + regId,
      emailSent: emailSentResult,
      rowIndex: existingRowIndex > 0 ? existingRowIndex : sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendConfirmationEmail(record) {
  if (!record) return false;
  var leader = (record.members && record.members[0]) ? record.members[0] : null;
  var leaderEmail = leader ? leader.email : null;
  if (!leaderEmail) return false;

  var regId = record.id || "REGISTRATION";
  var teamName = (record.team && record.team.teamName) ? record.team.teamName : "Your Team";
  var leaderName = leader.name || "Team Leader";
  var feePaid = record.fee ? ("₹" + record.fee + " PAID") : "₹999 PAID";
  
  // Format members table
  var membersHtml = "";
  if (record.members && record.members.length > 0) {
    membersHtml += '<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:14px;">';
    membersHtml += '<tr style="background:#1e293b; color:#94a3b8; text-align:left;">';
    membersHtml += '<th style="padding:10px; border:1px solid #334155;">Role</th>';
    membersHtml += '<th style="padding:10px; border:1px solid #334155;">Name</th>';
    membersHtml += '<th style="padding:10px; border:1px solid #334155;">Email</th>';
    membersHtml += '<th style="padding:10px; border:1px solid #334155;">Phone</th>';
    membersHtml += '<th style="padding:10px; border:1px solid #334155;">College</th>';
    membersHtml += '</tr>';
    
    for (var i = 0; i < record.members.length; i++) {
      var m = record.members[i];
      var role = (i === 0) ? 'Leader' : ('Member ' + (i + 1));
      membersHtml += '<tr style="color:#e2e8f0; background:#0f172a;">';
      membersHtml += '<td style="padding:10px; border:1px solid #334155; font-weight:bold; color:#00f0ff;">' + role + '</td>';
      membersHtml += '<td style="padding:10px; border:1px solid #334155;">' + (m.name || '') + '</td>';
      membersHtml += '<td style="padding:10px; border:1px solid #334155;">' + (m.email || '') + '</td>';
      membersHtml += '<td style="padding:10px; border:1px solid #334155;">' + (m.phone || '') + '</td>';
      membersHtml += '<td style="padding:10px; border:1px solid #334155;">' + (m.college || '') + '</td>';
      membersHtml += '</tr>';
    }
    membersHtml += '</table>';
  }

  var subject = "🎉 Registration Confirmed: " + teamName + " (ID: " + regId + ") - " + ORGANIZER_NAME + " " + EVENT_NAME;

  var htmlBody = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #0b0f17; color: #f8fafc; padding: 25px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #1e293b;">
      
      <!-- HEADER -->
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #1e293b;">
        <h3 style="color: #00f0ff; margin: 0; font-size: 16px; letter-spacing: 2px; text-transform: uppercase;">${ORGANIZER_NAME} Presents</h3>
        <h1 style="color: #ffffff; margin: 5px 0 10px 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">${EVENT_NAME}</h1>
        <div style="display: inline-block; background: #16a34a; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-weight: bold; font-size: 14px;">
          ✓ PAYMENT & REGISTRATION CONFIRMED
        </div>
      </div>

      <!-- GREETING -->
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #e2e8f0; line-height: 1.5; margin-top: 0;">
          Dear <strong>${leaderName}</strong>,
        </p>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          Congratulations! Your team <strong>${teamName}</strong> has successfully completed registration and payment for <strong>${ORGANIZER_NAME} ${EVENT_NAME}</strong>.
        </p>
      </div>

      <!-- CRITICAL ENTRY INSTRUCTION WARNING BOX -->
      <div style="background-color: #451a03; border: 2px solid #f59e0b; padding: 18px; border-radius: 8px; margin: 15px 0;">
        <h3 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 17px;">
          ⚠️ IMPORTANT INSTRUCTION FOR HACKATHON DAY
        </h3>
        <p style="color: #fef3c7; margin: 0; font-size: 14px; line-height: 1.6; font-weight: 600;">
          You will get entry into the hackathon venue <u>ONLY</u> upon presenting this correct Registration ID (<span style="color:#00f0ff; font-size:16px;">${regId}</span>). Please keep this email safe and show it at the registration desk on hackathon day.
        </p>
      </div>

      <!-- REGISTRATION SUMMARY BOX -->
      <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #38bdf8; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 8px; font-size:17px;">📌 Registration Overview</h3>
        <table style="width: 100%; color: #e2e8f0; font-size: 14px; line-height: 1.9;">
          <tr><td style="width: 150px; color: #94a3b8;">Registration ID:</td><td><strong style="color:#00f0ff; font-size:16px;">${regId}</strong></td></tr>
          <tr><td style="color: #94a3b8;">Team Name:</td><td><strong>${teamName}</strong></td></tr>
          <tr><td style="color: #94a3b8;">Date & Time:</td><td><strong>${EVENT_DATE}</strong></td></tr>
          <tr><td style="color: #94a3b8;">Location:</td><td><strong>${EVENT_LOCATION}</strong></td></tr>
          <tr><td style="color: #94a3b8;">Payment Status:</td><td><span style="color:#4ade80; font-weight:bold;">${feePaid}</span></td></tr>
        </table>
      </div>

      <!-- TEAM MEMBERS SECTION -->
      <div style="margin: 20px 0;">
        <h3 style="color: #38bdf8; margin-bottom: 10px; font-size:17px;">👥 Registered Team Members</h3>
        ${membersHtml}
      </div>

      <!-- EVENT SCHEDULE PREVIEW -->
      <div style="background: #0f172a; border: 1px solid #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #a855f7; margin-top: 0; font-size: 16px;">📅 Hackathon Schedule (${EVENT_DATE})</h3>
        <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li><strong>09:00 AM:</strong> Registration & Check-in (Show this email)</li>
          <li><strong>09:30 AM:</strong> Hackathon Introduction</li>
          <li><strong>10:00 AM:</strong> Problem Statements Revealed</li>
          <li><strong>10:00 AM – 04:00 PM:</strong> Development & Implementation</li>
          <li><strong>04:00 PM – 05:30 PM:</strong> Project Presentations & Demos</li>
          <li><strong>05:30 PM – 06:00 PM:</strong> Evaluation & Results</li>
        </ul>
      </div>

      <!-- CONTACT FOOTER -->
      <div style="background: #1e293b; padding: 15px; border-radius: 8px; text-align: center; margin-top: 25px; border-top: 2px solid #334155;">
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 5px 0;">Have questions or need assistance?</p>
        <p style="color: #e2e8f0; font-size: 14px; margin: 0;">
          📧 <a href="mailto:${CONTACT_EMAIL}" style="color: #38bdf8; text-decoration: none;">${CONTACT_EMAIL}</a> &nbsp;|&nbsp; 
          📞 <span style="color: #38bdf8;">${CONTACT_PHONES}</span>
        </p>
      </div>

      <div style="text-align: center; padding-top: 15px; font-size: 12px; color: #64748b;">
        © 2026 ${ORGANIZER_NAME}. All rights reserved.
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: leaderEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "Nooral.AI HackVerse Team",
      replyTo: CONTACT_EMAIL
    });
    return true;
  } catch (err) {
    Logger.log("Email sending error: " + err.toString());
    return false;
  }
}

// Utility function to test/authorize mail sending in Apps Script editor
function authorizeMail() {
  var testRecord = {
    id: "REG-TEST123",
    status: "paid",
    fee: 999,
    team: { teamName: "Test Team" },
    members: [{ name: "Test Leader", email: Session.getActiveUser().getEmail(), phone: "9876543210", college: "Test College" }]
  };
  var result = sendConfirmationEmail(testRecord);
  Logger.log("Test mail result: " + result);
}
