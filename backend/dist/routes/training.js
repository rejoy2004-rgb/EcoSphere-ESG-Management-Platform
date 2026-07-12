"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    const { employeeId, trainingName, completedAt, status } = req.body;
    if (!employeeId || !trainingName) {
        return res.status(400).json({ error: 'EmployeeId and trainingName are required' });
    }
    try {
        const record = await prisma.trainingRecord.create({
            data: {
                employeeId,
                trainingName,
                completedAt: completedAt ? new Date(completedAt) : null,
                status: status || 'ASSIGNED'
            }
        });
        res.status(201).json(record);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const list = await prisma.trainingRecord.findMany({
            include: { employee: true }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const record = await prisma.trainingRecord.findUnique({
            where: { id: req.params.id },
            include: { employee: true }
        });
        if (!record) {
            return res.status(404).json({ error: 'Training record not found' });
        }
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/:id', auth_1.authenticateJWT, async (req, res) => {
    const { employeeId, trainingName, completedAt, status } = req.body;
    try {
        const existing = await prisma.trainingRecord.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Training record not found' });
        }
        const updated = await prisma.trainingRecord.update({
            where: { id: req.params.id },
            data: {
                employeeId: employeeId !== undefined ? employeeId : existing.employeeId,
                trainingName: trainingName !== undefined ? trainingName : existing.trainingName,
                completedAt: completedAt !== undefined ? (completedAt ? new Date(completedAt) : null) : existing.completedAt,
                status: status !== undefined ? status : existing.status
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        await prisma.trainingRecord.delete({ where: { id: req.params.id } });
        res.json({ message: 'Training record deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
