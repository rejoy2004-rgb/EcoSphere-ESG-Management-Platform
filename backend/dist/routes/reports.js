"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const auth_1 = require("../middleware/auth");
const reporting_1 = require("../utils/reporting");
const router = (0, express_1.Router)();
async function handleExport(res, dataset, format, title, filters) {
    if (!format || format === 'json') {
        return res.json(dataset);
    }
    if (format === 'csv') {
        let csv = `Report: ${title}\nGenerated: ${new Date().toISOString()}\nFilters: ${JSON.stringify(filters)}\n\n`;
        if (dataset.carbonTransactions.length > 0) {
            csv += "CARBON TRANSACTIONS\nID,Department,Source Type,Quantity,CO2e,Date\n";
            for (const t of dataset.carbonTransactions) {
                csv += `${t.id},${t.department?.name || ''},${t.sourceType},${t.quantity},${t.calculatedCO2e},${t.transactionDate}\n`;
            }
            csv += "\n";
        }
        if (dataset.csrActivities.length > 0) {
            csv += "CSR ACTIVITIES\nID,Title,Department,Date,Points,Status\n";
            for (const a of dataset.csrActivities) {
                csv += `${a.id},"${a.title.replace(/"/g, '""')}",${a.department?.name || ''},${a.date},${a.points},${a.status}\n`;
            }
            csv += "\n";
        }
        if (dataset.csrParticipations.length > 0) {
            csv += "CSR PARTICIPATIONS\nID,Employee,Activity,Status,Points Earned\n";
            for (const p of dataset.csrParticipations) {
                csv += `${p.id},${p.employee?.name || ''},"${p.activity?.title.replace(/"/g, '""')}",${p.approvalStatus},${p.pointsEarned}\n`;
            }
            csv += "\n";
        }
        if (dataset.audits.length > 0) {
            csv += "AUDITS\nID,Title,Department,Auditor,Start Date,Status\n";
            for (const au of dataset.audits) {
                csv += `${au.id},"${au.title.replace(/"/g, '""')}",${au.department?.name || ''},${au.auditor?.name || ''},${au.startDate},${au.status}\n`;
            }
            csv += "\n";
        }
        if (dataset.complianceIssues.length > 0) {
            csv += "COMPLIANCE ISSUES\nID,Description,Owner,Due Date,Status,Severity\n";
            for (const c of dataset.complianceIssues) {
                csv += `${c.id},"${c.description.replace(/"/g, '""')}",${c.owner?.name || ''},${c.dueDate},${c.status},${c.severity}\n`;
            }
            csv += "\n";
        }
        if (dataset.challenges.length > 0) {
            csv += "CHALLENGES\nID,Title,Difficulty,XP,Status\n";
            for (const ch of dataset.challenges) {
                csv += `${ch.id},"${ch.title.replace(/"/g, '""')}",${ch.difficulty},${ch.xp},${ch.status}\n`;
            }
            csv += "\n";
        }
        if (dataset.challengeParticipations.length > 0) {
            csv += "CHALLENGE PARTICIPATIONS\nID,Employee,Challenge,Progress,Approval,XP Awarded\n";
            for (const cp of dataset.challengeParticipations) {
                csv += `${cp.id},${cp.employee?.name || ''},"${cp.challenge?.title.replace(/"/g, '""')}",${cp.progress},${cp.approval},${cp.xpAwarded}\n`;
            }
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.csv"`);
        return res.send(csv);
    }
    if (format === 'xlsx') {
        const workbook = new exceljs_1.default.Workbook();
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metadata Key', key: 'key', width: 25 },
            { header: 'Value', key: 'value', width: 50 }
        ];
        summarySheet.addRow({ key: 'Report Title', value: title });
        summarySheet.addRow({ key: 'Generated At', value: new Date().toISOString() });
        summarySheet.addRow({ key: 'Filters Applied', value: JSON.stringify(filters) });
        summarySheet.addRow({ key: 'Carbon Transactions Count', value: dataset.carbonTransactions.length });
        summarySheet.addRow({ key: 'CSR Activities Count', value: dataset.csrActivities.length });
        summarySheet.addRow({ key: 'CSR Participations Count', value: dataset.csrParticipations.length });
        summarySheet.addRow({ key: 'Audits Count', value: dataset.audits.length });
        summarySheet.addRow({ key: 'Compliance Issues Count', value: dataset.complianceIssues.length });
        summarySheet.addRow({ key: 'Challenges Count', value: dataset.challenges.length });
        summarySheet.addRow({ key: 'Challenge Participations Count', value: dataset.challengeParticipations.length });
        if (dataset.carbonTransactions.length > 0) {
            const sheet = workbook.addWorksheet('Carbon Transactions');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Department', key: 'dept', width: 20 },
                { header: 'Source Type', key: 'type', width: 15 },
                { header: 'Quantity', key: 'qty', width: 15 },
                { header: 'CO2e Calculated', key: 'co2e', width: 15 },
                { header: 'Date', key: 'date', width: 25 }
            ];
            for (const t of dataset.carbonTransactions) {
                sheet.addRow({
                    id: t.id,
                    dept: t.department?.name || '',
                    type: t.sourceType,
                    qty: Number(t.quantity),
                    co2e: Number(t.calculatedCO2e),
                    date: t.transactionDate.toISOString ? t.transactionDate.toISOString() : String(t.transactionDate)
                });
            }
        }
        if (dataset.csrActivities.length > 0) {
            const sheet = workbook.addWorksheet('CSR Activities');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Department', key: 'dept', width: 20 },
                { header: 'Date', key: 'date', width: 25 },
                { header: 'Points', key: 'points', width: 10 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            for (const a of dataset.csrActivities) {
                sheet.addRow({
                    id: a.id,
                    title: a.title,
                    dept: a.department?.name || '',
                    date: a.date.toISOString ? a.date.toISOString() : String(a.date),
                    points: a.points,
                    status: a.status
                });
            }
        }
        if (dataset.csrParticipations.length > 0) {
            const sheet = workbook.addWorksheet('CSR Participations');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Employee', key: 'emp', width: 20 },
                { header: 'Activity', key: 'act', width: 30 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Points Earned', key: 'points', width: 15 }
            ];
            for (const p of dataset.csrParticipations) {
                sheet.addRow({
                    id: p.id,
                    emp: p.employee?.name || '',
                    act: p.activity?.title || '',
                    status: p.approvalStatus,
                    points: p.pointsEarned
                });
            }
        }
        if (dataset.audits.length > 0) {
            const sheet = workbook.addWorksheet('Audits');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Department', key: 'dept', width: 20 },
                { header: 'Auditor', key: 'auditor', width: 20 },
                { header: 'Start Date', key: 'start', width: 25 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            for (const au of dataset.audits) {
                sheet.addRow({
                    id: au.id,
                    title: au.title,
                    dept: au.department?.name || '',
                    auditor: au.auditor?.name || '',
                    start: au.startDate.toISOString ? au.startDate.toISOString() : String(au.startDate),
                    status: au.status
                });
            }
        }
        if (dataset.complianceIssues.length > 0) {
            const sheet = workbook.addWorksheet('Compliance Issues');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Description', key: 'desc', width: 40 },
                { header: 'Owner', key: 'owner', width: 20 },
                { header: 'Due Date', key: 'due', width: 25 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Severity', key: 'sev', width: 15 }
            ];
            for (const c of dataset.complianceIssues) {
                sheet.addRow({
                    id: c.id,
                    desc: c.description,
                    owner: c.owner?.name || '',
                    due: c.dueDate.toISOString ? c.dueDate.toISOString() : String(c.dueDate),
                    status: c.status,
                    severity: c.severity
                });
            }
        }
        if (dataset.challenges.length > 0) {
            const sheet = workbook.addWorksheet('Challenges');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Difficulty', key: 'diff', width: 15 },
                { header: 'XP Reward', key: 'xp', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            for (const ch of dataset.challenges) {
                sheet.addRow({
                    id: ch.id,
                    title: ch.title,
                    diff: ch.difficulty,
                    xp: ch.xp,
                    status: ch.status
                });
            }
        }
        if (dataset.challengeParticipations.length > 0) {
            const sheet = workbook.addWorksheet('Challenge Participations');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Employee', key: 'emp', width: 20 },
                { header: 'Challenge', key: 'chal', width: 30 },
                { header: 'Progress %', key: 'progress', width: 15 },
                { header: 'Approval', key: 'app', width: 15 },
                { header: 'XP Awarded', key: 'xp', width: 15 }
            ];
            for (const cp of dataset.challengeParticipations) {
                sheet.addRow({
                    id: cp.id,
                    emp: cp.employee?.name || '',
                    chal: cp.challenge?.title || '',
                    progress: cp.progress,
                    app: cp.approval,
                    xp: cp.xpAwarded
                });
            }
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();
    }
    if (format === 'pdf') {
        const doc = new pdfkit_1.default({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
        doc.pipe(res);
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
        doc.text(`Filters applied: ${JSON.stringify(filters)}`);
        doc.moveDown();
        doc.fontSize(14).text('Summary Metrics:', { underline: true });
        doc.fontSize(10).text(`Carbon Transactions: ${dataset.carbonTransactions.length}`);
        doc.text(`CSR Activities: ${dataset.csrActivities.length}`);
        doc.text(`CSR Participations: ${dataset.csrParticipations.length}`);
        doc.text(`Audits: ${dataset.audits.length}`);
        doc.text(`Compliance Issues: ${dataset.complianceIssues.length}`);
        doc.text(`Challenges: ${dataset.challenges.length}`);
        doc.text(`Challenge Participations: ${dataset.challengeParticipations.length}`);
        doc.moveDown();
        if (dataset.carbonTransactions.length > 0) {
            doc.fontSize(12).text('Carbon Transactions:', { underline: true });
            for (const t of dataset.carbonTransactions) {
                doc.fontSize(8).text(`ID: ${t.id} | Dept: ${t.department?.name || ''} | Type: ${t.sourceType} | Qty: ${t.quantity} | CO2e: ${t.calculatedCO2e}`);
            }
            doc.moveDown();
        }
        if (dataset.csrActivities.length > 0) {
            doc.fontSize(12).text('CSR Activities:', { underline: true });
            for (const a of dataset.csrActivities) {
                doc.fontSize(8).text(`ID: ${a.id} | Title: ${a.title} | Dept: ${a.department?.name || ''} | Pts: ${a.points} | Status: ${a.status}`);
            }
            doc.moveDown();
        }
        if (dataset.csrParticipations.length > 0) {
            doc.fontSize(12).text('CSR Participations:', { underline: true });
            for (const p of dataset.csrParticipations) {
                doc.fontSize(8).text(`ID: ${p.id} | Employee: ${p.employee?.name || ''} | Act: ${p.activity?.title || ''} | Status: ${p.approvalStatus}`);
            }
            doc.moveDown();
        }
        if (dataset.audits.length > 0) {
            doc.fontSize(12).text('Audits:', { underline: true });
            for (const au of dataset.audits) {
                doc.fontSize(8).text(`ID: ${au.id} | Title: ${au.title} | Auditor: ${au.auditor?.name || ''} | Status: ${au.status}`);
            }
            doc.moveDown();
        }
        if (dataset.complianceIssues.length > 0) {
            doc.fontSize(12).text('Compliance Issues:', { underline: true });
            for (const c of dataset.complianceIssues) {
                doc.fontSize(8).text(`ID: ${c.id} | Desc: ${c.description} | Owner: ${c.owner?.name || ''} | Status: ${c.status} | Severity: ${c.severity}`);
            }
            doc.moveDown();
        }
        if (dataset.challenges.length > 0) {
            doc.fontSize(12).text('Challenges:', { underline: true });
            for (const ch of dataset.challenges) {
                doc.fontSize(8).text(`ID: ${ch.id} | Title: ${ch.title} | Diff: ${ch.difficulty} | XP: ${ch.xp} | Status: ${ch.status}`);
            }
            doc.moveDown();
        }
        if (dataset.challengeParticipations.length > 0) {
            doc.fontSize(12).text('Challenge Participations:', { underline: true });
            for (const cp of dataset.challengeParticipations) {
                doc.fontSize(8).text(`ID: ${cp.id} | Employee: ${cp.employee?.name || ''} | Challenge: ${cp.challenge?.title || ''} | Progress: ${cp.progress}% | Approval: ${cp.approval}`);
            }
        }
        doc.end();
        return;
    }
    res.status(400).json({ error: `Unsupported format: ${format}` });
}
router.get('/environmental', auth_1.authenticateJWT, async (req, res) => {
    const { departmentId, start, end, format } = req.query;
    const filters = {
        departmentId: departmentId,
        dateRange: (start || end) ? { start: start, end: end } : undefined,
        module: 'ENVIRONMENTAL'
    };
    try {
        const dataset = await (0, reporting_1.buildReportDataset)(filters);
        await handleExport(res, dataset, format, 'Environmental (E) Report', filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/social', auth_1.authenticateJWT, async (req, res) => {
    const { departmentId, start, end, format, employeeId } = req.query;
    const filters = {
        departmentId: departmentId,
        dateRange: (start || end) ? { start: start, end: end } : undefined,
        module: 'SOCIAL',
        employeeId: employeeId
    };
    try {
        const dataset = await (0, reporting_1.buildReportDataset)(filters);
        await handleExport(res, dataset, format, 'Social (S) Report', filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/governance', auth_1.authenticateJWT, async (req, res) => {
    const { departmentId, start, end, format } = req.query;
    const filters = {
        departmentId: departmentId,
        dateRange: (start || end) ? { start: start, end: end } : undefined,
        module: 'GOVERNANCE'
    };
    try {
        const dataset = await (0, reporting_1.buildReportDataset)(filters);
        await handleExport(res, dataset, format, 'Governance (G) Report', filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/esg-summary', auth_1.authenticateJWT, async (req, res) => {
    const { departmentId, start, end, format } = req.query;
    const filters = {
        departmentId: departmentId,
        dateRange: (start || end) ? { start: start, end: end } : undefined
    };
    try {
        const dataset = await (0, reporting_1.buildReportDataset)(filters);
        await handleExport(res, dataset, format, 'ESG Comprehensive Summary Report', filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/custom', auth_1.authenticateJWT, async (req, res) => {
    const filters = req.body || {};
    const { format } = req.query;
    try {
        const dataset = await (0, reporting_1.buildReportDataset)(filters);
        await handleExport(res, dataset, format, 'Custom Dynamic ESG Report', filters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
