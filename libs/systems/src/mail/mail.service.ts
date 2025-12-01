import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {ConfigService} from "@nestjs/config";
import {SendMail} from "./types";

@Injectable()
export class MailService {
    private transporter;

    constructor(private config: ConfigService) {
        // const user = this.config.get<string>('MAIL_NAME')!;
        // const pass = this.config.get<string>('MAIL_PASSWORD')!;
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

    async sendMail(mailData: SendMail)  {
        try {
            const {to, text, attachments = [], subject} = mailData

            const info = await this.transporter.sendMail({
                from: "anikaev09072007@mail.ru",
                to,
                subject,
                text,
                attachments: attachments.map(url => ({ path: url })),
            });
            console.log(`[MailService] Message sent to ${to}: %s`, info.messageId);
            return info;

        } catch (e) {
            console.error('[MailService] FAILED to send email. Nodemailer Error:', e.message);
            throw new Error(`SMTP Send Failure. Check credentials/network. Details: ${e.message || 'Unknown error'}`);
        }
    }
}
