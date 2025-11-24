import {MailService} from "../mail.service";
import type { Job } from 'bull';
import {Processor, Process} from "@nestjs/bull";

@Processor('mail')
export class MailProcessor {
    constructor(private mailService: MailService) {}

    @Process()
    async handelMail(jod: Job)  {
        const {users, text, media, date} = jod.data;

        const now = new Date();
        const shouldStop = new Date(date) <= now

        if (shouldStop) {
            await jod.remove()
            return
        }

        for (let email of users) {
            await this.mailService.sendMail(email, 'Новое сообщение', text, media)
        }
    }
}