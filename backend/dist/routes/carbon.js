"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post('/auto-calculate', auth_1.authenticateJWT, async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findFirst();
        const enabled = settings ? settings.autoEmissionCalculationEnabled : true;
        if (!enabled) {
            return res.status(400).json({ error: 'Automatic carbon emission calculation is disabled in settings' });
        }
        const unprocessed = await prisma.sourceRecord.findMany({
            where: { processed: false }
        });
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const createdById = adminUser?.id;
        if (!createdById && unprocessed.length > 0) {
            return res.status(400).json({ error: 'No Admin user exists to associate with auto-calculated carbon transactions' });
        }
        let processedCount = 0;
        for (const record of unprocessed) {
            const factor = await prisma.emissionFactor.findFirst({
                where: {
                    activityType: record.type,
                    status: 'ACTIVE'
                }
            });
            if (factor && createdById) {
                const quantityNum = Number(record.quantity);
                const co2eFactorNum = Number(factor.co2eFactor);
                const calculatedCO2e = quantityNum * co2eFactorNum;
                await prisma.$transaction([
                    prisma.carbonTransaction.create({
                        data: {
                            departmentId: record.departmentId,
                            emissionFactorId: factor.id,
                            sourceType: record.type,
                            sourceRecordId: record.id,
                            quantity: record.quantity,
                            calculatedCO2e,
                            transactionDate: record.date,
                            autoCalculated: true,
                            createdById: createdById
                        }
                    }),
                    prisma.sourceRecord.update({
                        where: { id: record.id },
                        data: { processed: true }
                    })
                ]);
                processedCount++;
            }
        }
        res.json({ message: `Successfully processed ${processedCount} ERP source records` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
