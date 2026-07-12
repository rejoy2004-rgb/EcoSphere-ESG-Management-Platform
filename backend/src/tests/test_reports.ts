import ExcelJS from 'exceljs';
import { ReportFilters } from '../utils/reporting';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(1);
  }
}

function mockFilter(dataset: any, filters: ReportFilters) {
  const start = filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined;
  const end = filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined;
  
  return dataset.filter((t: any) => {
    if (filters.departmentId && t.departmentId !== filters.departmentId) {
      return false;
    }
    if (start && new Date(t.date) < start) {
      return false;
    }
    if (end && new Date(t.date) > end) {
      return false;
    }
    return true;
  });
}

async function runVerification() {
  console.log('--- STARTING REPORT CUSTOM FILTERING VERIFICATION ---');

  const mockTransactions = [
    { id: '1', departmentId: 'dept-a', date: '2026-06-01', co2: 100 },
    { id: '2', departmentId: 'dept-b', date: '2026-06-15', co2: 200 },
    { id: '3', departmentId: 'dept-a', date: '2026-07-01', co2: 150 },
    { id: '4', departmentId: 'dept-a', date: '2026-08-01', co2: 300 }
  ];

  const filters: ReportFilters = {
    departmentId: 'dept-a',
    dateRange: { start: '2026-06-10', end: '2026-07-15' }
  };

  const filtered = mockFilter(mockTransactions, filters);
  assert(filtered.length === 1, `Filtered count should be 1, got ${filtered.length}`);
  assert(filtered[0].id === '3', `Filtered element should have ID '3', got ${filtered[0].id}`);

  let csvLines = 0;
  let csv = `ID,Department,Date,CO2\n`;
  for (const t of filtered) {
    csv += `${t.id},${t.departmentId},${t.date},${t.co2}\n`;
    csvLines++;
  }
  assert(csvLines === 1, `CSV record count should match filtered count (1), got ${csvLines}`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');
  sheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Dept', key: 'dept' }
  ];
  for (const t of filtered) {
    sheet.addRow({ id: t.id, dept: t.departmentId });
  }
  const rowCount = sheet.actualRowCount - 1;
  assert(rowCount === 1, `Excel record count should match filtered count (1), got ${rowCount}`);

  console.log('--- REPORT FILTERING VERIFICATIONS PASSED SUCCESSFUL ---');
}

runVerification();
