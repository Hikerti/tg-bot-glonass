import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from "@nestjs/config";
import { SendMail } from "./types";
import {AbstractNotificationService, ChannelJobData} from "../forwarding-message";

@Injectable()
export class MailService extends AbstractNotificationService {
    private transporter;

    constructor(private config: ConfigService) {
        super();
        const user = "anikaev09072007@mail.ru"
        const pass = "lUiKVtoxA1eamnBapbL6"

        this.transporter = nodemailer.createTransport({
            host: 'smtp.mail.ru',
            port: 465,
            secure: true,
            auth: {
                user: user,
                pass: pass,
            },
        });

        this.transporter.verify().then(() => {
            console.log("✅ SMTP Mail.ru connection verified and ready.");
        }).catch(error => {
            console.error("❌ SMTP Mail.ru verification FAILED:", error.message);
        });
    }

    public async send(data: ChannelJobData): Promise<void> {
        const { users, text, media, subject } = data;

        for (const user of users) {
            if (user.email) {
                const mailData: SendMail = {
                    to: user.email,
                    subject: subject || 'Рассылка',
                    text,
                    attachments: media
                };
                await this.sendSingleMail(mailData);
            }
        }
    }

    private async sendSingleMail(mailData: SendMail) {
        try {
            const { to, text, attachments = [], subject } = mailData;

            await this.transporter.sendMail({
                from: "anikaev09072007@mail.ru",
                to,
                subject,
                text,
                attachments: attachments.map(url => ({ path: url })),
            });
        } catch (e) {
            console.error(e);
        }
    }
}