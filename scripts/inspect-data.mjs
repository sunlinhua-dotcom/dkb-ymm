import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../raw_data/2025手术类价格表.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Read as array of arrays to inspect structure
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("Total rows:", rawData.length);
console.log("First 5 rows:");
rawData.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});

// Based on inspection, we will decide how to parse again correctly.
// For now, save the raw array to a temp file if needed, but I mostly need the log output.
