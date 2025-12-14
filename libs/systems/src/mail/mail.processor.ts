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
            await this.mailService.send(job.data);

        } catch (e) {
            console.error(`[Processor] Error handling mail job ${job.id}:`, e);
            throw e;
        }
    }
}