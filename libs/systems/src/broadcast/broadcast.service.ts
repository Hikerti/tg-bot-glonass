import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {InjectBot} from "nestjs-telegraf";
import {Telegraf} from "telegraf";
import {getMediaType} from "@shared";
import {AbstractNotificationService, ChannelJobData} from "../forwarding-message";
import {InputMediaPhoto, InputMediaVideo} from "telegraf/types";

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

        for (const user of users) {
            const chatId = user.tgId;

            if (media && media.length > 0 && chatId) {
                const mediaGroup = media.map((url, index) => {
                    const type = getMediaType(url);
                    const caption = (index === 0) ? text : undefined;

                    if (type === 'photo') {
                        return {
                            type: 'photo',
                            media: url,
                            caption: caption
                        } as InputMediaPhoto;
                    } else {
                        return {
                            type: 'video',
                            media: url,
                            caption: caption
                        } as InputMediaVideo;
                    }
                }) as InputMediaPhoto[];
                await this.clientBot.telegram.sendMediaGroup(chatId, mediaGroup);
            }

            if (!chatId) {
                console.warn(`[BroadcastService] User ${user.id} has no tgId. Skipping.`);
                continue;
            }

            try {
                await this.clientBot.telegram.sendMessage(chatId, text);

            }

            catch (error) {
            console.error(`Ошибка при отправке сообщения пользователю ${chatId}: ${error.message}`);
        }
    }
    }
}