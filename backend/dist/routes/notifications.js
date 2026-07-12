"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const list = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch('/:id/read', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const existing = await prisma.notification.findUnique({
            where: { id: req.params.id }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
