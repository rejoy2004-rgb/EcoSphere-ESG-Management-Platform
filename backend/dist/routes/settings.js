"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findFirst();
        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: {
                    id: 'default',
                    esgWeightEnvironmental: 40,
                    esgWeightSocial: 30,
                    esgWeightGovernance: 30,
                    subScoreFormulaConfigJson: '{}',
                    autoEmissionCalculationEnabled: true,
                    evidenceRequirementEnabled: false,
                    badgeAutoAwardEnabled: true,
                    notificationChannels: '{}',
                    policyReminderCadenceDays: 7
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    const { esgWeightEnvironmental, esgWeightSocial, esgWeightGovernance, subScoreFormulaConfigJson, autoEmissionCalculationEnabled, evidenceRequirementEnabled, badgeAutoAwardEnabled, notificationChannels, policyReminderCadenceDays } = req.body;
    try {
        let settings = await prisma.systemSetting.findFirst();
        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: {
                    id: 'default',
                    esgWeightEnvironmental: esgWeightEnvironmental !== undefined ? parseInt(esgWeightEnvironmental) : 40,
                    esgWeightSocial: esgWeightSocial !== undefined ? parseInt(esgWeightSocial) : 30,
                    esgWeightGovernance: esgWeightGovernance !== undefined ? parseInt(esgWeightGovernance) : 30,
                    subScoreFormulaConfigJson: subScoreFormulaConfigJson !== undefined ? JSON.stringify(subScoreFormulaConfigJson) : '{}',
                    autoEmissionCalculationEnabled: autoEmissionCalculationEnabled !== undefined ? autoEmissionCalculationEnabled === true : true,
                    evidenceRequirementEnabled: evidenceRequirementEnabled !== undefined ? evidenceRequirementEnabled === true : false,
                    badgeAutoAwardEnabled: badgeAutoAwardEnabled !== undefined ? badgeAutoAwardEnabled === true : true,
                    notificationChannels: notificationChannels !== undefined ? JSON.stringify(notificationChannels) : '{}',
                    policyReminderCadenceDays: policyReminderCadenceDays !== undefined ? parseInt(policyReminderCadenceDays) : 7
                }
            });
        }
        else {
            settings = await prisma.systemSetting.update({
                where: { id: settings.id },
                data: {
                    esgWeightEnvironmental: esgWeightEnvironmental !== undefined ? parseInt(esgWeightEnvironmental) : settings.esgWeightEnvironmental,
                    esgWeightSocial: esgWeightSocial !== undefined ? parseInt(esgWeightSocial) : settings.esgWeightSocial,
                    esgWeightGovernance: esgWeightGovernance !== undefined ? parseInt(esgWeightGovernance) : settings.esgWeightGovernance,
                    subScoreFormulaConfigJson: subScoreFormulaConfigJson !== undefined ? (typeof subScoreFormulaConfigJson === 'string' ? subScoreFormulaConfigJson : JSON.stringify(subScoreFormulaConfigJson)) : settings.subScoreFormulaConfigJson,
                    autoEmissionCalculationEnabled: autoEmissionCalculationEnabled !== undefined ? autoEmissionCalculationEnabled === true : settings.autoEmissionCalculationEnabled,
                    evidenceRequirementEnabled: evidenceRequirementEnabled !== undefined ? evidenceRequirementEnabled === true : settings.evidenceRequirementEnabled,
                    badgeAutoAwardEnabled: badgeAutoAwardEnabled !== undefined ? badgeAutoAwardEnabled === true : settings.badgeAutoAwardEnabled,
                    notificationChannels: notificationChannels !== undefined ? (typeof notificationChannels === 'string' ? notificationChannels : JSON.stringify(notificationChannels)) : settings.notificationChannels,
                    policyReminderCadenceDays: policyReminderCadenceDays !== undefined ? parseInt(policyReminderCadenceDays) : settings.policyReminderCadenceDays
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
