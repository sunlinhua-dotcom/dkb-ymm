import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../raw_data/2025手术类价格表.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get data as array of arrays
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Headers are at row index 2 (0-based)
// Data starts at row index 3
const dataStartRow = 3;
const processedData = [];

let currentCategory = "";

for (let i = dataStartRow; i < rawData.length; i++) {
    const row = rawData[i];
    // Skip completely empty rows
    if (!row || row.length === 0) continue;

    const rawCategory = row[0];
    const name = row[1];
    const priceCn = row[2];
    const priceKr = row[3];

    // If name is missing, it might be a filler row or end of section, safest to skip if no product name
    if (!name) continue;

    // Update category if present (merged cells handling)
    if (rawCategory) {
        currentCategory = rawCategory.toString().trim();
    }

    processedData.push({
        category: currentCategory,
        name: name.toString().trim(),
        price_cn: priceCn ? priceCn.toString() : "N/A",
        price_kr: priceKr ? priceKr.toString() : "N/A"
    });
}

const outputPath = path.join(__dirname, '../src/data/knowledge_base.json');
fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
console.log(`Successfully processed ${processedData.length} items.`);
console.log("Sample item:", processedData[0]);
