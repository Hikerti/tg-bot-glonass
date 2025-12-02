import { MailService } from "./mail.service";
import type { Job, Queue } from 'bull';
import { Processor, Process, InjectQueue } from "@nestjs/bull";
import { removeRepeatable } from "@shared";

@Processor('mail')
export class MailProcessor {
    constructor(
        private mailService: MailService,
        @InjectQueue('mail') private mailQueue: Queue
    ) {}

    @Process()
    async handelMail(jod: Job) {
        try {
            const { users, text, media, date } = jod.data;

            await removeRepeatable(date, jod, this.mailQueue)

            for (let user of users) {
                const mailData = {
                    to: user.email,
                    subject: 'Новое сообщение',
                    text,
                    attachments: media
                }
                await this.mailService.sendMail(mailData);
            }
            console.log(`[Processor] Mail sent to ${users.length} users for job ${jod.id}.`);

        } catch (e) {
            console.error('[Processor] Error handling mail job (or removing repeatable job):', e);
        }
    }
}