import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SendMail } from './types';
import {
  AbstractNotificationService,
  ChannelJobData,
} from '../forwarding-message';
import { UserTypeEmail } from '@domains';

@Injectable()
export class MailService extends AbstractNotificationService {
  private transporter;

  constructor(private config: ConfigService) {
    super();
    const user = 'kz@ostrov59.ru';
    const pass = 'ROk6aJeARaM980lQb5QX';

    this.transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
    });

    this.transporter
      .verify()
      .then(() => {})
      .catch((error) => {
        console.error('❌ SMTP Mail.ru verification FAILED:', error.message);
      });
  }

  public async send(data: ChannelJobData): Promise<void> {
    const { users, text, media, subject } = data;

    for (const user of users) {
      if (user.typeEmail === UserTypeEmail.MAIL) {
        if (user.email) {
          const mailData: SendMail = {
            to: user.email,
            subject: subject || 'Рассылка',
            text,
            attachments: media,
          };
          await this.sendSingleMail(mailData);
        }
      }
    }
  }

  private async sendSingleMail(mailData: SendMail) {
    try {
      const { to, text, attachments = [], subject } = mailData;

      await this.transporter.sendMail({
        from: 'kz@ostrov59.ru',
        to,
        subject,
        text,
        attachments: attachments.map((url) => ({ path: url })),
      });
    } catch (e) {
      console.error(e);
    }
  }
}