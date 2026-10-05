import { google } from "googleapis";
import { HEADERS, recordToRow } from "./rows.js";

export function isSheetsConfigured() {
  return !!(
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    (process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY)
  );
}

function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), spreadsheetId };
}

let queue = Promise.resolve();

function enqueue(task) {
  queue = queue
    .then(() => task())
    .catch((err) => {
      console.error("[Google Sheets] Queue task error:", err?.message || err);
    });
  return queue;
}

async function ensureSheetAndHeaders(sheets, spreadsheetId, tabName) {
  const escapeTab = tabName.replace(/'/g, "''");
  const getSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetList = getSpreadsheet.data.sheets || [];
  const exists = sheetList.some(
    (s) => s.properties && s.properties.title === tabName
  );

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
              },
            },
          },
        ],
      },
    });
  }

  // Check header row
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapeTab}'!A1:ZZ1`,
  });

  const headerValues = headerRes.data.values;
  if (!headerValues || headerValues.length === 0 || headerValues[0].length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${escapeTab}'!A1:ZZ1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADERS],
      },
    });
  }
}

async function syncRecordToSheet(record) {
  // Check if Apps Script Webhook URL is configured (Option 2)
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const rowData = recordToRow(record);
    const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record,
        row: rowData,
        headers: HEADERS,
      }),
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Apps Script HTTP error! Status: ${response.status}`);
    }
    return;
  }

  // Fallback to Service Account API (Option 1)
  const client = getSheetsClient();
  if (!client) return;
  const { sheets, spreadsheetId } = client;
  const tabName = process.env.GOOGLE_SHEET_TAB || "Registrations";
  const escapeTab = tabName.replace(/'/g, "''");

  await ensureSheetAndHeaders(sheets, spreadsheetId, tabName);

  // Fetch column A to find existing Registration ID
  const colARes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${escapeTab}'!A:A`,
  });

  const rows = colARes.data.values || [];
  const rowIndex = rows.findIndex((r) => r && r[0] === record.id);
  const rowData = recordToRow(record);

  if (rowIndex >= 0) {
    // Update existing row (1-based index)
    const targetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${escapeTab}'!A${targetRow}:ZZ${targetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });
  } else {
    // Append new row at rows.length + 1
    const targetRow = rows.length + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${escapeTab}'!A${targetRow}:ZZ${targetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });
  }
}

export function syncRegistration(record) {
  if (!isSheetsConfigured() || !record || record.status !== "paid") return;
  enqueue(async () => {
    try {
      await syncRecordToSheet(record);
    } catch (err) {
      console.error(`[Google Sheets] Failed to sync registration ${record.id}:`, err?.message || err);
    }
  });
}

export async function syncAllRegistrations(records) {
  if (!isSheetsConfigured()) {
    throw new Error("Google Sheets is not configured");
  }
  const paidRecords = records.filter((r) => r && r.status === "paid");
  let syncedCount = 0;
  for (const record of paidRecords) {
    await new Promise((resolve) => {
      enqueue(async () => {
        try {
          await syncRecordToSheet(record);
          syncedCount++;
        } catch (err) {
          console.error(`[Google Sheets] Backfill error for ${record.id}:`, err?.message || err);
        } finally {
          resolve();
        }
      });
    });
  }
  return syncedCount;
}
