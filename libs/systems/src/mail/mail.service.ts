import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {ConfigService} from "@nestjs/config";
import {SendMail} from "./types";

@Injectable()
export class MailService {
    private transporter;

    constructor(private config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: this.config.get<string>('MAIL_NAME')!,
                pass: this.config.get<string>('MAIL_PASSWORD')!,
            },
        });
    }

    async sendMail(mailData: SendMail)  {
        try {
            const {to, text, attachments = [], subject} = mailData
            return this.transporter.sendMail({
                from: this.config.get<string>('MAIL_PASSWORD'),
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
