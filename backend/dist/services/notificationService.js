"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function sendNotification(userId, type, message) {
    try {
        const settings = await prisma.systemSetting.findFirst();
        const channels = settings ? JSON.parse(settings.notificationChannels) : {};
        const channelsForType = channels[type] || { inApp: true, email: false };
        if (channelsForType.inApp) {
            await prisma.notification.create({
                data: {
                    userId,
                    type,
                    message,
                    read: false,
                    channel: 'IN_APP'
                }
            });
        }
        if (channelsForType.email) {
            console.log(`[MOCK EMAIL SENDER] Alert sent to user ${userId} via email - Type: ${type} - Msg: ${message}`);
        }
    }
    catch (error) {
        console.error('Failed to send notification:', error);
    }
}
