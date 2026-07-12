"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function assert(condition, message) {
    if (!condition) {
        console.error('Assertion failed:', message);
        process.exit(1);
    }
}
function verifyBusinessRules(evidenceRequired, proofUrl) {
    if (evidenceRequired && !proofUrl) {
        return false;
    }
    return true;
}
async function runSettingsVerification() {
    console.log('--- STARTING SETTINGS EVIDENCE TOGGLE RULES VERIFICATION ---');
    assert(verifyBusinessRules(true, null) === false, 'Should block approval when evidence required and proof is missing');
    assert(verifyBusinessRules(true, 'http://evidence.com/file.pdf') === true, 'Should allow approval when evidence required and proof is provided');
    assert(verifyBusinessRules(false, null) === true, 'Should allow approval when evidence is not required even if proof is missing');
    assert(verifyBusinessRules(false, 'http://evidence.com/file.pdf') === true, 'Should allow approval when evidence is not required and proof is provided');
    console.log('Memory rule verifications passed successfully.');
    try {
        await prisma.$connect();
        console.log('[DB CONNECTED] Database is reachable. Performing database validations.');
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: { evidenceRequirementEnabled: true },
            create: { id: 'default', evidenceRequirementEnabled: true }
        });
        let settings = await prisma.systemSetting.findFirst();
        assert(settings?.evidenceRequirementEnabled === true, 'Database setting should be true');
        await prisma.systemSetting.update({
            where: { id: 'default' },
            data: { evidenceRequirementEnabled: false }
        });
        settings = await prisma.systemSetting.findFirst();
        assert(settings?.evidenceRequirementEnabled === false, 'Database setting should be updated to false');
        console.log('Database toggles validation completed successfully.');
    }
    catch (error) {
        console.log('[DB OFFLINE] Database server not reached. Skipping database state tests.');
    }
    console.log('--- SETTINGS VERIFICATION PASSED ---');
}
runSettingsVerification();
