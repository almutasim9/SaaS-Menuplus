import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';

try {
    const workbook = XLSX.readFile('locations.xlsx');
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Sheet "${sheetName}" has ${data.length} rows.`);
        if (data.length > 0) {
            console.log(`Sample row from ${sheetName}:`, data[Math.min(data.length - 1, 5)]);
        }
    });
} catch (error) {
    console.error('Error reading Excel:', error);
}
