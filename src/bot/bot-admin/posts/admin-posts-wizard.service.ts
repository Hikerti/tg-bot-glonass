import { ConfigService } from "@nestjs/config";
import { Action, Ctx, InjectBot, Wizard, WizardStep } from "nestjs-telegraf";
import { Context, Markup, Scenes, Telegraf } from "telegraf";
import { Message } from "telegraf/types";
import axios from "axios";
import { PostDTO, PostType } from "@domains";
import { S3Service } from "@infrastract";
import { AdminGetMedia } from "./admin-get-media";
import { AiService } from "@integrations";

interface CreatePostWizardState {
    text?: string;
    media: string[];
    interval?: string;
    date?: string;
    type?: PostType;
    postToWall: boolean;
    postToMessage: boolean;
    generationPrompt?: string;
    awaitingPrompt?: boolean;
}

interface PostCreationContext extends Scenes.WizardContext {
    wizard: Scenes.WizardContext['wizard'] & {
        state: CreatePostWizardState;
    };
}

@Wizard("create-post-wizard", { botName: "adminBot" })
export class AdminPostsWizardService extends AdminGetMedia {
    constructor(
        protected readonly config: ConfigService,
        @InjectBot('adminBot') protected readonly bot: Telegraf<Context>,
        protected readonly s3Service: S3Service,
        private readonly aiService: AiService,
    ) {
        super(config, bot, s3Service)
    }

    private ensureState(ctx: PostCreationContext) {
        if (!ctx.wizard.state) {
            ((ctx.wizard as any).state) = {
                media: [],
                postToWall: false,
                postToMessage: false
            } as CreatePostWizardState;
        }
        if (!Array.isArray(ctx.wizard.state.media)) ctx.wizard.state.media = [];
        if (ctx.wizard.state.postToWall === undefined) ctx.wizard.state.postToWall = false;
        if (ctx.wizard.state.postToMessage === undefined) ctx.wizard.state.postToMessage = false;
    }

    @WizardStep(1)
    async step1(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        await ctx.reply(
            "Шаг 1/5: Введите текст или сгенерируйте его:",
            Markup.inlineKeyboard([
                [Markup.button.callback('✨ Сгенерировать текст', 'generation_text')],
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ])
        );
        await ctx.wizard.next();
    }

    @WizardStep(2)
    async step2(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        const msgText = (ctx.message as Message.TextMessage)?.text?.trim();

        if (ctx.wizard.state.awaitingPrompt) {
            if (!msgText) {
                await ctx.reply("Введите промпт для генерации.");
                return;
            }
            ctx.wizard.state.awaitingPrompt = false;
            ctx.wizard.state.generationPrompt = msgText;
            const waitingMsg = await ctx.reply("Генерирую текст...");
            try {
                const generated = await this.aiService.generatePost(msgText);
                const text = generated ?? '';
                if (!text) {
                    await ctx.reply("ИИ вернул пустой ответ. Введите другой промпт.");
                    ctx.wizard.state.awaitingPrompt = true;
                    return;
                }
                ctx.wizard.state.text = text;
                await ctx.reply(
                    text,
                    Markup.inlineKeyboard([
                        [Markup.button.callback("🚀 Использовать", "use_generated_text")],
                        [Markup.button.callback("🔄 Перегенерировать", "regenerate_text")],
                        [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
                    ])
                );
            } catch {
                ctx.wizard.state.awaitingPrompt = true;
                await ctx.reply("Ошибка генерации. Введите промпт снова.");
            } finally {
                try { await ctx.deleteMessage(waitingMsg.message_id); } catch {}
            }
            return;
        }

        if (!msgText) {
            await ctx.reply("Введите текст.");
            return;
        }

        ctx.wizard.state.text = msgText;
        await ctx.reply("Текст принят. Шаг 2/5: Отправьте медиафайл (фото/видео/документ/аудио):");
        await ctx.wizard.next();
    }

    @Action('generation_text')
    async generationText(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        ctx.wizard.state.awaitingPrompt = true;
        await ctx.reply("Введите промпт для генерации текста:");
    }

    @Action("use_generated_text")
    async useGeneratedText(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        const text = ctx.wizard.state.text ?? '';
        if (ctx.callbackQuery?.message) {
            try {
                await ctx.telegram.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    undefined,
                    `Текст принят.\n\n${text}`
                ).catch(()=>{});
            } catch {}
        }
        await ctx.reply("Текст принят. Шаг 2/5: Отправьте медиафайл (фото/видео/документ/аудио):", Markup.inlineKeyboard([
            [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
        ]));
        await ctx.wizard.next();
        await this.mediaStep(ctx);
    }

    @Action("regenerate_text")
    async regenerateTextAction(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        const prompt = ctx.wizard.state.generationPrompt;
        if (!prompt) {
            ctx.wizard.state.awaitingPrompt = true;
            await ctx.reply("Промпт потерян. Введите новый промпт:", Markup.inlineKeyboard([
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ]));
            return;
        }
        const waitingMsg = await ctx.reply("Перегенерирую...");
        try {
            const generated = await this.aiService.generatePost(prompt + 'Текст обязательно должен быть без линих символов и маркдаун разметки');
            const text = generated ?? '';
            if (!text) {
                ctx.wizard.state.awaitingPrompt = true;
                await ctx.reply("ИИ вернул пустой ответ. Введите новый промпт.");
                return;
            }
            ctx.wizard.state.text = text;
            await ctx.reply(
                text,
                Markup.inlineKeyboard([
                    [Markup.button.callback("🚀 Использовать", "use_generated_text")],
                    [Markup.button.callback("🔄 Перегенерировать", "regenerate_text")],
                    [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
                ])
            );
        } catch {
            ctx.wizard.state.awaitingPrompt = true;
            await ctx.reply("Ошибка при перегенерации. Попробуйте другой промпт.");
        } finally {
            try { await ctx.deleteMessage(waitingMsg.message_id); } catch {}
        }
    }

    @Action("cancel_post_creation")
    async cancelPost(@Ctx() ctx: PostCreationContext) {
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        if (ctx.callbackQuery?.message) {
            try { await ctx.telegram.editMessageReplyMarkup(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id, undefined, undefined).catch(()=>{}); } catch {}
        }
        await ctx.reply("Создание поста отменено.");
        return ctx.scene.leave();
    }

    @WizardStep(3)
    async mediaStep(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        const msg = ctx.message as Message;
        const isMedia = ('photo' in msg) || ('video' in msg) || ('document' in msg) || ('audio' in msg);

        if (!isMedia) {
            await ctx.reply(
                "Отправьте медиафайл (фото/видео/документ/аудио).",
                Markup.inlineKeyboard([[Markup.button.callback("Закончить отправление", "finish_media")], [Markup.button.callback("❌ Отменить", "cancel_post_creation")]])
            );
            return;
        }

        try {
            const file = await this.uploadMediaFromTelegram(msg);
            if (!file?.url) {
                await ctx.reply("Не удалось загрузить файл или получить ссылку S3. Попробуйте снова.");
                return;
            }
            ctx.wizard.state.media.push(file.url);
            await ctx.reply(
                `Файл загружен (${ctx.wizard.state.media.length}).`,
                Markup.inlineKeyboard([
                    [Markup.button.callback("Загрузить ещё", "upload_more"), Markup.button.callback("Закончить", "finish_media")],
                    [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
                ])
            );
        } catch {
            await ctx.reply("Ошибка при загрузке файла.");
        }
    }

    @Action("upload_more")
    async uploadMore(@Ctx() ctx: PostCreationContext) {
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        await ctx.reply("Отправьте следующий файл.");
        await this.mediaStep(ctx);
    }

    @Action("finish_media")
    async finishMedia(@Ctx() ctx: PostCreationContext) {
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        await ctx.reply("Шаг 3/5: Введите интервал рассылки (например 1d, 2h, 30m):", Markup.inlineKeyboard([
            [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
        ]));
        await ctx.wizard.next();
    }

    @WizardStep(4)
    async step4(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        const intervalText = ctx.wizard.state.interval ?? (ctx.message as Message.TextMessage)?.text?.trim();
        if (!ctx.wizard.state.interval) {
            if (!intervalText) {
                await ctx.reply("Интервал не может быть пустым. Введите интервал (например 1d, 2h, 30m):");
                return;
            }
            ctx.wizard.state.interval = intervalText;
            await ctx.reply("Шаг 4/5: Введите дату окончания рассылки (dd.mm.yyyy):", Markup.inlineKeyboard([
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ]));
            return;
        }

        const dateText = (ctx.message as Message.TextMessage)?.text?.trim();
        if (!dateText) {
            await ctx.reply("Дата не может быть пустой. Введите дату (dd.mm.yyyy):", Markup.inlineKeyboard([
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ]));
            return;
        }
        ctx.wizard.state.date = dateText;
        await ctx.reply(
            "Шаг 5/5: Выберите куда отправлять:",
            Markup.inlineKeyboard([
                [Markup.button.callback("Телеграмм", "tg_send")],
                [Markup.button.callback("Почта", "mail_send")],
                [Markup.button.callback("ВК", "vk_send")],
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ])
        );
        await ctx.wizard.next();
    }

    @WizardStep(5)
    async step5(@Ctx() ctx: PostCreationContext) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Пожалуйста, выберите канал рассылки (Телеграмм/Почта/ВК).");
        }
    }

    @Action("vk_send")
    async vkSend(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        try { if (ctx.callbackQuery) await ctx.answerCbQuery(); } catch {}
        ctx.wizard.state.type = PostType.VK;
        await ctx.reply(
            "Шаг 5/5 (ВК): Выберите дополнительные опции:",
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(`На стену: ${ctx.wizard.state.postToWall ? '✅' : '❌'}`, "vk_wall_toggle"),
                    Markup.button.callback(`В чат: ${ctx.wizard.state.postToMessage ? '✅' : '❌'}`, "vk_message_toggle")
                ],
                [Markup.button.callback("Сохранить пост", "save_final")],
                [Markup.button.callback("❌ Отменить", "cancel_post_creation")]
            ])
        );
    }

    @Action("vk_wall_toggle")
    async vkWallToggleAction(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        ctx.wizard.state.postToWall = !ctx.wizard.state.postToWall;
        return this.vkSend(ctx);
    }

    @Action("vk_message_toggle")
    async vkMessageToggleAction(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        ctx.wizard.state.postToMessage = !ctx.wizard.state.postToMessage;
        return this.vkSend(ctx);
    }

    @Action("tg_send")
    async tgSend(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        ctx.wizard.state.type = PostType.TG;
        await this.finalAction(ctx);
    }

    @Action("mail_send")
    async mailSend(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        ctx.wizard.state.type = PostType.MAIL;
        await this.finalAction(ctx);
    }

    @Action("save_final")
    async finalAction(@Ctx() ctx: PostCreationContext) {
        this.ensureState(ctx);
        const { text, type, date, interval, media, postToWall, postToMessage } = ctx.wizard.state;
        if (!text || !type || !date || !interval) {
            await ctx.reply("Ошибка: не все обязательные поля заполнены.");
            return ctx.scene.leave();
        }
        if (type === PostType.VK && !postToWall && !postToMessage) {
            await ctx.reply("Для ВК нужно выбрать 'На стену' или 'В чат'.");
            return this.vkSend(ctx);
        }
        const payload: PostDTO.Create = { text, type, date, interval, media, postToWall, postToMessage, active: true };
        try {
            await axios.post(`${this.config.get<string>('GATE_URL')}/posts`, payload);
            await ctx.reply("Пост успешно создан и отправлен на планирование!");
        } catch {
            await ctx.reply("Произошла ошибка при сохранении поста.");
        }
        return ctx.scene.leave();
    }
}
