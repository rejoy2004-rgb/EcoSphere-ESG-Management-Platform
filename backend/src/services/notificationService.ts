import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sendNotification(userId: string, type: string, message: string) {
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
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
