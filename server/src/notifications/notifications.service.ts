import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    const now = new Date();

    // Find all unsent notifications that should be sent now or in the past
    const pendingNotifications =
      await this.prisma.scheduledNotification.findMany({
        where: {
          sent: false,
          notifyAt: {
            lte: now,
          },
        },
        include: {
          exam: true,
        },
      });

    if (pendingNotifications.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${pendingNotifications.length} pending notifications`,
    );

    const messages: ExpoPushMessage[] = [];
    const notificationIds: number[] = [];

    for (const notification of pendingNotifications) {
      // Skip if push token is invalid
      if (!Expo.isExpoPushToken(notification.expoPushToken)) {
        this.logger.warn(`Invalid push token: ${notification.expoPushToken}`);
        continue;
      }

      const exam = notification.exam;
      if (!exam) continue;

      const examTime = new Date(exam.examDateTime);
      const minutesUntil = Math.round(
        (examTime.getTime() - now.getTime()) / 60000,
      );

      let timeString = '';
      if (minutesUntil <= 1) {
        timeString = 'starting now!';
      } else if (minutesUntil < 60) {
        timeString = `in ${minutesUntil} minutes`;
      } else if (minutesUntil < 1440) {
        const hours = Math.round(minutesUntil / 60);
        timeString = `in ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        const days = Math.round(minutesUntil / 1440);
        timeString = `in ${days} day${days > 1 ? 's' : ''}`;
      }

      messages.push({
        to: notification.expoPushToken,
        sound: 'default',
        title: '📚 Exam Reminder',
        body: `${exam.name} is ${timeString}`,
        data: { examId: exam.id },
      });

      notificationIds.push(notification.id);
    }

    // Send notifications in chunks
    if (messages.length > 0) {
      try {
        const chunks = this.expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.log(`Sent ${ticketChunk.length} notifications`);
        }

        // Mark notifications as sent
        await this.prisma.scheduledNotification.updateMany({
          where: {
            id: { in: notificationIds },
          },
          data: {
            sent: true,
          },
        });
      } catch (error) {
        this.logger.error('Error sending notifications:', error);
      }
    }
  }
}
