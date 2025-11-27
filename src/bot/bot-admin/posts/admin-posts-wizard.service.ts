import { ConfigService } from "@nestjs/config";
import {Action, Ctx, InjectBot, Wizard, WizardStep} from "nestjs-telegraf";
import {Context, Markup, Scenes, Telegraf} from "telegraf";
import { CallbackQuery, Message } from "telegraf/types";
import axios from "axios";
import {PostDTO} from "@domains";
import {PostType} from "@prisma/client";
import {S3Service} from "@infrastract";

interface CreatePostWizardState {
    text?: string;
    media: string[];
    interval?: string;
    date?: string;
    type?: PostType;
}

@Wizard("create-post-wizard", { botName: "adminBot" })
export class AdminPostsWizardService {
    private message?: Message.TextMessage;
    private callbackQuery?: CallbackQuery.DataQuery;
    private state!: CreatePostWizardState;

    constructor(
        private readonly config: ConfigService,
        @InjectBot('adminBot') private readonly bot: Telegraf<Context>,
        private readonly s3Service: S3Service,
    ) {}

    private init(ctx: Scenes.WizardContext) {
        this.message = ctx.message as Message.TextMessage;
        this.callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
        this.state = ctx.wizard.state as CreatePostWizardState;

        if (!this.state.media) this.state.media = [];
    }

    private extractMediaFileId(msg: Message): string | null {
        if ("photo" in msg) return msg.photo[msg.photo.length - 1].file_id;
        if ("video" in msg) return msg.video.file_id;
        if ("audio" in msg) return msg.audio.file_id;
        if ("document" in msg) return msg.document.file_id;
        return null;
    }

    private getMimeTypeFromMessage(msg: Message): string | null {
        if ("photo" in msg) return 'image/jpeg';
        if ("video" in msg) return msg.video.mime_type || 'video/mp4';
        if ("audio" in msg) return msg.audio.mime_type || 'audio/mpeg';
        if ("document" in msg) return msg.document.mime_type || 'application/octet-stream';
        return null;
    }

    private getFileNameFromMessage(msg: Message): string | null {
        if ("photo" in msg) return `photo_${msg.message_id}.jpg`;
        if ("video" in msg) return msg.video.file_name || `video_${msg.message_id}.mp4`;
        if ("audio" in msg) return msg.audio.file_name || `audio_${msg.message_id}.mp3`;
        if ("document" in msg) return msg.document.file_name || `document_${msg.message_id}.dat`;
        return null;
    }

    private async uploadMediaFromTelegram(msg: Message) {
        const fileId = this.extractMediaFileId(msg);
        if (!fileId) return null;

        const tgFile = await this.bot.telegram.getFile(fileId);
        const filePath = tgFile.file_path as string;
        if (!filePath) return null;

        const token = this.config.get<string>('ADMIN_BOT_TOKEN');
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(fileResp.data);

        const mimeType = this.getMimeTypeFromMessage(msg) || 'application/octet-stream';
        const originalname = this.getFileNameFromMessage(msg) || `${fileId}`;

        return this.s3Service.uploadFile({ buffer, originalname, mimetype: mimeType });
    }

    @Action("cancel_media")
    async cancelMedia(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.answerCbQuery();
        await ctx.reply("Все медиа файлы сохранены!");
        ctx.wizard.selectStep(5);
        await ctx.reply(
            "Введите интервал рассылки (например 1d, 2h, 30m):"
        );
        return;
    }

    @WizardStep(1)
    async step1(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);
        await ctx.reply("Введите текст для поста:");
        return ctx.wizard.next();
    }

    @WizardStep(2)
    async step2(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) return ctx.reply("Текст не может быть пустым! Введите снова.");

        this.state.text = text;

        await ctx.reply(
            "🖼️ **Отправьте первое медиа** (фото, видео, аудио или документ):"
        );

        return ctx.wizard.next();
    }

    @WizardStep(3)
    async step3(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const msg = ctx.message as Message;

        try {
            const file = await this.uploadMediaFromTelegram(msg);

            if (!file || !file.url) {
                return ctx.reply("Это не медиафайл. Пожалуйста, отправьте фото/видео/документ.");
            }

            this.state.media.push(file.url);

            await ctx.reply(
                "Файл загружен. Отправьте **ещё** файл или завершите:",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Загрузить ещё файл", "next_media")],
                    [Markup.button.callback("Закончить отправление", "cancel_media")]
                ])
            );

            return ctx.wizard.next();

        } catch (e) {
            console.error('Ошибка загрузки первого медиа:', e);
            return ctx.reply("Произошла ошибка при загрузке файла. Попробуйте снова.");
        }
    }

    @Action("next_media")
    async nextMediaAction(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.answerCbQuery();
        await ctx.reply("Отлично! Отправьте следующий файл.");
        return;
    }

    @WizardStep(4)
    async step4(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);
        const msg = ctx.message as Message;

        if (!msg) return;

        try {
            const file= await this.uploadMediaFromTelegram(msg);;

            if (!file || !file.url) {
                return ctx.reply("Пожалуйста, отправьте медиафайл или нажмите 'Закончить отправление'.");
            }

            this.state.media.push(file.url);

            await ctx.reply(
                "Файл загружен. Отправьте ещё файл или завершите:",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Загрузить ещё файл", "next_media")],
                    [Markup.button.callback("Закончить отправление", "cancel_media")]
                ])
            );

            return;
        } catch (e) {
            console.error('Ошибка загрузки дополнительного медиа:', e);
            return ctx.reply("Произошла ошибка при загрузке файла. Попробуйте снова.");
        }
    }

    @WizardStep(5)
    async step5(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        await ctx.reply(
            "Введите интервал рассылки (например 1d, 2h, 30m):"
        );

        return ctx.wizard.next();
    }

    @WizardStep(6)
    async step6(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) return ctx.reply("Интервал не может быть пустым!");

        this.state.interval = text;

        await ctx.reply(
            "Введите дату окончания рассылки (dd.mm.yyyy):"
        );

        return ctx.wizard.next();
    }

    @WizardStep(7)
    async step7(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) return ctx.reply("Дата не может быть пустой!");

        this.state.date = text;

        await ctx.reply(
            "Выберите куда отправлять:",
            Markup.inlineKeyboard([
                [Markup.button.callback("Телеграмм", "tg_send")],
                [Markup.button.callback("Почта", "mail_send")],
            ])
        );

        return ctx.wizard.next();
    }

    @Action("tg_send")
    @Action("mail_send")
    @Action("all_send")
    async savePost(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const action = this.callbackQuery!.data;

        if (action === "tg_send") this.state.type = "tg";
        if (action === "mail_send") this.state.type = "mail";

        const {text, type, date, interval, media} = this.state;
        if (text && type && date && interval ) {
            const data: PostDTO.Create = {
                text,
                type,
                date,
                interval,
                media,
                active: true
            }

            await axios.post(`${this.config.get<string>('GATE_URL')}/posts`, data);
        }

        await ctx.reply("Пост успешно создан!");

        return ctx.scene.leave();
    }
}