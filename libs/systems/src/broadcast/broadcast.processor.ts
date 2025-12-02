import {InjectQueue, Process, Processor} from "@nestjs/bull";
import {InjectBot} from "nestjs-telegraf";
import {Telegraf} from "telegraf";
import type {Job, Queue} from "bull";
import type { BroadcastJobData } from "./type";
import {InputMediaPhoto} from "telegraf/types";
import {removeRepeatable} from "@shared";

@Processor('broadcast')
export class BroadcastProcessor {
    constructor(
        @InjectBot('clientBot')
        private clientBot: Telegraf,
        @InjectQueue('broadcast') private broadcastQueue: Queue,
    ) {}

    @Process('send-message')
    async handleSendMessage(job: Job<BroadcastJobData>) {
        const { chatId, text, media, date } = job.data;

        await removeRepeatable<BroadcastJobData>(date, job, this.broadcastQueue)

        if (!chatId) return;

        try {
            await this.clientBot.telegram.sendMessage(chatId, text);
            // if (media && media.length > 0) {
            //     const mediaGroup = media.map(url => ({
            //         type: 'photo' as const,
            //         media: url,
            //         caption: text
            //     })) as InputMediaPhoto[];
            //
            //     await this.clientBot.telegram.sendMediaGroup(chatId, mediaGroup);
            // } else {
            //
            // }
            console.log(`Сообщение отправлено пользователю ${chatId}`);
        } catch (error) {
            console.error(`Ошибка при отправке сообщения пользователю ${chatId}: ${error.message}`);
        }
    }
}