import {Injectable} from "@nestjs/common";
import {InjectQueue} from "@nestjs/bull";
import type {Job, Queue} from "bull";
import {ConfigService} from "@nestjs/config";
import {BroadcastJobData} from "./type";
import {InjectBot} from "nestjs-telegraf";
import {Telegraf} from "telegraf";
import {removeRepeatable} from "@shared";
import {AbstractNotificationService, ChannelJobData} from "../forwarding-message";

@Injectable()
export class BroadcastService extends AbstractNotificationService {
    constructor(
        private readonly config: ConfigService,
        @InjectBot('clientBot')
        private clientBot: Telegraf,
    ) {
        super();
    }
    async send(data: ChannelJobData) {
        const { users, text, media, date } = data;

        // if (media && media.length > 0) {
        //     const mediaGroup = media.map((url, index) => {
        //         const type = getMediaType(url);
        //         const caption = (index === 0) ? text : undefined;
        //
        //         if (type === 'photo') {
        //             return {
        //                 type: 'photo',
        //                 media: url,
        //                 caption: caption
        //             } as InputMediaPhoto;
        //         } else {
        //             return {
        //                 type: 'video',
        //                 media: url,
        //                 caption: caption
        //             } as InputMediaVideo;
        //         }
        //     }) as InputMediaPhoto[];
        //     await this.clientBot.telegram.sendMediaGroup(chatId, mediaGroup);
        // } else {
        //
        // }

        for (const user of users) {
            const chatId = user.tgId;

            if (!chatId) {
                console.warn(`[BroadcastService] User ${user.id} has no tgId. Skipping.`);
                continue;
            }

            try {
                await this.clientBot.telegram.sendMessage(chatId, text);

                console.log(`Сообщение отправлено пользователю ${chatId}`);
            }

            catch (error) {
            console.error(`Ошибка при отправке сообщения пользователю ${chatId}: ${error.message}`);
        }
    }
    }
}