import { Processor, Process, InjectQueue } from "@nestjs/bull";
import type { Job, Queue } from 'bull';
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
            console.log(`[Processor] mail job ${job.id} completed.`);
            await this.mailService.send(job.data);

            console.log(`[Processor] mail job ${job.id} completed.`);
        } catch (e) {
            console.error(`[Processor] Error handling mail job ${job.id}:`, e);
            throw e;
        }
    }
}