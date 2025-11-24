import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class MailService {
    constructor(private config: ConfigService) {
    }

    private transporter = nodemailer.createTransport({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
            user: this.config.get<string>('MAIL_NAME')!,
            pass: this.config.get<string>('MAIL_PASSWORD')!,
        },
    });

    async sendMail(to: string, subject: string, text: string, attachments: string[] = []) {
        return this.transporter.sendMail({
            from: this.config.get<string>('MAIL_PASSWORD'),
            to,
            subject,
            text,
            attachments: attachments.map(url => ({ path: url })),
        });
    }
}
