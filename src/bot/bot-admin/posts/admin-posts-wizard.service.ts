import { ConfigService } from "@nestjs/config";
import {Action, Ctx, InjectBot, Wizard, WizardStep} from "nestjs-telegraf";
import {Context, Markup, Scenes, Telegraf} from "telegraf";
import { CallbackQuery, Message } from "telegraf/types";
import axios from "axios";
import {PostDTO} from "@domains";
import {PostType} from "@prisma/client";

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

    constructor(private readonly config: ConfigService, @InjectBot('adminBot') private readonly bot: Telegraf<Context>) {}

    private init(ctx: Scenes.WizardContext) {
        this.message = ctx.message as Message.TextMessage;
        this.callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
        this.state = ctx.wizard.state as CreatePostWizardState;

        if (!this.state.media) this.state.media = [];
    }

    @Action("next_media")
    async nextMedia(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const msg = ctx.message as Message;
        try {
            if (!msg || (!("photo" in msg) && !("video" in msg) && !("audio" in msg) && !("document" in msg))) {
                return ctx.reply("Отправьте файл (фото/видео/аудио/документ).");
            }

            let fileId: string;
            if ("photo" in msg) fileId = msg.photo[msg.photo.length - 1].file_id;
            else if ("video" in msg) fileId = msg.video.file_id;
            else if ("audio" in msg) fileId = msg.audio.file_id;
            else if ("document" in msg) fileId = msg.document.file_id;
            else return;

            const tgFile = await this.bot.telegram.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${this.config.get("ADMIN_BOT_TOKEN")}/${tgFile.file_path}`;

            const fileResp = await axios.get(fileUrl, { responseType: "arraybuffer" });

            const uploadResp = await axios.post(
                `${this.config.get<string>("GATE_URL")}/upload`,
                fileResp.data,
                {
                    headers: { "Content-Type": "application/octet-stream" }
                }
            );

            this.state.media.push(uploadResp.data.url);

            await ctx.reply(
                "Файл загружен. Отправьте ещё файл или завершите:",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Загрузить ещё файл", "next_media")],
                    [Markup.button.callback("Закончить отправление", "cancel_media")]
                ])
            );
        } catch (e) {
            console.error(e);
            throw new Error(e)
        }
    }

    @Action("cancel_media")
    async cancelMedia(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Все медиа файлы сохранены!");
        ctx.wizard.next();
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
            "Отправьте медиа (фото/видео/аудио/документы).\nИли нажмите кнопку:",
            Markup.inlineKeyboard([
                [Markup.button.callback("Загрузить ещё файл", "next_media")],
                [Markup.button.callback("Закончить отправление", "cancel_media")]
            ])
        );

        return ctx.wizard.next();
    }

    @WizardStep(3)
    async step3(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        await ctx.reply(
            "Введите интервал рассылки (например 1d, 2h, 30m):"
        );

        return ctx.wizard.next();
    }

    @WizardStep(4)
    async step4(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) return ctx.reply("Интервал не может быть пустым!");

        this.state.interval = text;

        await ctx.reply(
            "Введите дату окончания рассылки (dd.mm.yyyy):"
        );

        return ctx.wizard.next();
    }

    @WizardStep(5)
    async step5(@Ctx() ctx: Scenes.WizardContext) {
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
