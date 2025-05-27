const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('c:/Project/admin-dashboard/transaksi-2025-05-27 (4).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Print the first few rows to understand the structure
console.log('First 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

// Print column headers
console.log('\nColumn Headers:');
console.log(Object.keys(data[0]));

// Count total rows
console.log(`\nTotal rows: ${data.length}`);
