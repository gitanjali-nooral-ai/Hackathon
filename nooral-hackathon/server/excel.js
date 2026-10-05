import ExcelJS from "exceljs";
import { HEADERS, recordToRow } from "./rows.js";

export async function generateRegistrationsExcel(records, onlyPaid = false) {
  const filtered = onlyPaid
    ? records.filter((r) => r.status === "paid")
    : records;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Registrations");

  // Frozen top header row
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  // Add header row
  const headerRow = worksheet.addRow(HEADERS);
  headerRow.font = { bold: true };

  // Phone columns (1-based cell indices: Leader=10, M2=17, M3=24, M4=31)
  const phoneColIndices = [10, 17, 24, 31];

  // Add data rows
  filtered.forEach((record) => {
    const rowValues = recordToRow(record);
    const row = worksheet.addRow(rowValues);

    phoneColIndices.forEach((colIdx) => {
      const cell = row.getCell(colIdx);
      cell.numFmt = "@";
      if (cell.value !== undefined && cell.value !== null) {
        cell.value = String(cell.value);
      }
    });

    const regIdCell = row.getCell(1);
    regIdCell.numFmt = "@";
    if (regIdCell.value !== undefined && regIdCell.value !== null) {
      regIdCell.value = String(regIdCell.value);
    }
  });

  // Auto column widths
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const valStr = cell.value ? String(cell.value) : "";
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    column.width = Math.max(12, maxLen + 3);
  });

  return await workbook.xlsx.writeBuffer();
}
