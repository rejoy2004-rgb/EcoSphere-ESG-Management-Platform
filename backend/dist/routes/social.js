"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const gamification_1 = require("../services/gamification");
const notificationService_1 = require("../services/notificationService");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post('/csr-activities', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER', 'DEPARTMENT_HEAD']), async (req, res) => {
    const { title, description, categoryId, departmentId, date, location, targetParticipants, points } = req.body;
    if (!title || !categoryId || !departmentId || !date) {
        return res.status(400).json({ error: 'Title, categoryId, departmentId, and date are required' });
    }
    try {
        const activity = await prisma.cSRActivity.create({
            data: {
                title,
                description: description || null,
                categoryId,
                departmentId,
                date: new Date(date),
                location: location || null,
                targetParticipants: targetParticipants ? parseInt(targetParticipants) : null,
                points: points ? parseInt(points) : 0,
                status: 'DRAFT'
            }
        });
        res.status(201).json(activity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/csr-activities', auth_1.authenticateJWT, async (req, res) => {
    try {
        const list = await prisma.cSRActivity.findMany({
            include: {
                category: true,
                department: true
            }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/csr-activities/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const activity = await prisma.cSRActivity.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                department: true,
                participations: {
                    include: { employee: true }
                }
            }
        });
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/csr-activities/:id', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER', 'DEPARTMENT_HEAD']), async (req, res) => {
    const { title, description, categoryId, departmentId, date, location, targetParticipants, points } = req.body;
    try {
        const existing = await prisma.cSRActivity.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        const updated = await prisma.cSRActivity.update({
            where: { id: req.params.id },
            data: {
                title: title !== undefined ? title : existing.title,
                description: description !== undefined ? description : existing.description,
                categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
                departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
                date: date !== undefined ? new Date(date) : existing.date,
                location: location !== undefined ? location : existing.location,
                targetParticipants: targetParticipants !== undefined ? (targetParticipants ? parseInt(targetParticipants) : null) : existing.targetParticipants,
                points: points !== undefined ? parseInt(points) : existing.points
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/csr-activities/:id', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
    try {
        await prisma.cSRActivity.delete({ where: { id: req.params.id } });
        res.json({ message: 'Activity deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/csr-activities/:id/status', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    try {
        const activity = await prisma.cSRActivity.findUnique({ where: { id: req.params.id } });
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        const current = activity.status;
        let allowed = false;
        if (current === 'DRAFT' && (status === 'ACTIVE' || status === 'CANCELLED')) {
            allowed = true;
        }
        else if (current === 'ACTIVE' && (status === 'COMPLETED' || status === 'CANCELLED')) {
            allowed = true;
        }
        if (!allowed) {
            return res.status(400).json({ error: `Invalid status transition from ${current} to ${status}` });
        }
        const updated = await prisma.cSRActivity.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/csr-activities/:id/participate', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const activity = await prisma.cSRActivity.findUnique({ where: { id: req.params.id } });
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        const existing = await prisma.employeeParticipation.findFirst({
            where: {
                employeeId: req.user.id,
                activityId: req.params.id
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Already registered for this activity' });
        }
        const participation = await prisma.employeeParticipation.create({
            data: {
                employeeId: req.user.id,
                activityId: req.params.id,
                approvalStatus: 'PENDING'
            }
        });
        res.status(201).json(participation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/participation/:id/proof', auth_1.authenticateJWT, upload_1.upload.single('proof'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Proof file is required' });
    }
    try {
        const participation = await prisma.employeeParticipation.findUnique({ where: { id: req.params.id } });
        if (!participation) {
            return res.status(404).json({ error: 'Participation record not found' });
        }
        const proofUrl = `/uploads/${req.file.filename}`;
        const updated = await prisma.employeeParticipation.update({
            where: { id: req.params.id },
            data: { proofUrl }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/participation/:id/approve', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
    try {
        const participation = await prisma.employeeParticipation.findUnique({
            where: { id: req.params.id },
            include: { activity: true, employee: true }
        });
        if (!participation) {
            return res.status(404).json({ error: 'Participation record not found' });
        }
        const settings = await prisma.systemSetting.findFirst();
        const evidenceRequired = settings ? settings.evidenceRequirementEnabled : false;
        if (evidenceRequired && !participation.proofUrl) {
            return res.status(400).json({ error: 'Proof is required for approval based on system settings' });
        }
        const points = participation.activity.points;
        const [updatedParticipation] = await prisma.$transaction([
            prisma.employeeParticipation.update({
                where: { id: req.params.id },
                data: {
                    approvalStatus: 'APPROVED',
                    completionDate: new Date(),
                    pointsEarned: points
                }
            }),
            prisma.pointsLedgerEntry.create({
                data: {
                    employeeId: participation.employeeId,
                    delta: points,
                    reason: 'CSR_APPROVAL',
                    referenceId: participation.id
                }
            }),
            prisma.user.update({
                where: { id: participation.employeeId },
                data: {
                    pointsBalance: {
                        increment: points
                    }
                }
            })
        ]);
        await (0, gamification_1.evaluateBadgesForEmployee)(participation.employeeId);
        await (0, notificationService_1.sendNotification)(participation.employeeId, 'CSR_APPROVED', `Your participation in CSR Activity "${participation.activity.title}" was approved.`);
        res.json({
            message: 'Participation approved and points awarded',
            participation: updatedParticipation
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/participation/:id/reject', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), async (req, res) => {
    try {
        const participation = await prisma.employeeParticipation.findUnique({
            where: { id: req.params.id },
            include: { activity: true }
        });
        if (!participation) {
            return res.status(404).json({ error: 'Participation record not found' });
        }
        const updated = await prisma.employeeParticipation.update({
            where: { id: req.params.id },
            data: {
                approvalStatus: 'REJECTED'
            }
        });
        await (0, notificationService_1.sendNotification)(participation.employeeId, 'CSR_REJECTED', `Your participation in CSR Activity "${participation.activity.title}" was rejected.`);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
