import { MailService } from "./mail.service";
import type { Job, Queue, EveryRepeatOptions } from 'bull';
import { Processor, Process, InjectQueue } from "@nestjs/bull";

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

            const now = new Date();
            const shouldStop = new Date(date).getTime() >= now.getTime();
            console.log(users, now, shouldStop, text, media, date)

            if (shouldStop) {
                const repeatOpts = jod.opts.repeat;

                const isEveryRepeat = repeatOpts && 'every' in repeatOpts;
                const interval = isEveryRepeat ? (repeatOpts as EveryRepeatOptions).every : undefined;
                const jobId = jod.opts.jobId;

                if (jobId && interval) {
                    await this.mailQueue.removeRepeatable({
                        jobId: jobId as string,
                        every: interval,
                    });
                    console.warn(`[Processor] Recurring job ${jobId} stopped. Date ${date} has passed.`);
                }

                return;
            }

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