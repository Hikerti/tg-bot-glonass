import { Processor, Process, InjectQueue } from "@nestjs/bull";
import type { Job, Queue } from 'bull';
import { removeRepeatable } from "@shared";
import {MailService} from "./mail.service";

@Processor('mail')
export class MailProcessor {
    constructor(
        private mailService: MailService,
        @InjectQueue('mail') private mailQueue: Queue
    ) {}

    @Process()
    async handleMailJob(job: Job) {
        try {
            const { date } = job.data;

            await removeRepeatable(date, job, this.mailQueue);

            await this.mailService.send(job.data);

            console.log(`[Processor] Broadcast job ${job.id} completed.`);

        } catch (e) {
            console.error(`[Processor] Error handling broadcast job ${job.id}:`, e);
            throw e;
        }
    }
}