/** Minimal RFC 4180 CSV helpers (quoted fields, embedded commas/quotes/newlines). */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Text cells starting with these could run as formulas in Excel/Sheets. */
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: string | number | null | undefined, isText: boolean): string {
  if (value == null) return "";
  let s = String(value);
  if (isText && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build CSV text. Columns listed in `textColumns` are protected against formula injection. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][], textColumns: string[] = []): string {
  const text = new Set(textColumns.map((c) => header.indexOf(c)));
  const lines = [header.join(","), ...rows.map((r) => r.map((v, i) => escapeCell(v, text.has(i))).join(","))];
  return lines.join("\r\n") + "\r\n";
}

/** Undo the formula-injection guard added by toCsv when a file is re-imported. */
export function unguardCell(value: string): string {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}
