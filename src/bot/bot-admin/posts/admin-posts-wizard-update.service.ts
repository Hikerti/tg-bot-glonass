import { Wizard, WizardStep } from "nestjs-telegraf";
import { Scenes, Markup } from "telegraf";

interface UpdatePostWizardState {
    text: string;
    media: string[];  
    newMedia: string[]; // новые загруженные в S3
    step: string | null;
}

@Wizard("update-post-wizard")
export class AdminPostsWizardUpdateService {
    private message?: Message.TextMessage;
    private callbackQuery?: CallbackQuery.DataQuery;
    private state!: UpdatePostWizardPost;

    constructor(private readonly config: ConfigService, @InjectBot('adminBot') private readonly bot: Telegraf<Context>) {}

    private init(ctx: Scenes.WizardContext) {
        this.message = ctx.message as Message.TextMessage;
        this.callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
        this.state = ctx.wizard.state as CreatePostWizardState;

        if (!this.state.media) this.state.media = [];
    }{}

    @WizardStep(1)
async step1(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
    const post = ctx.session.post; 
    this.state.text = post.text
    this.state.media = post.media

        await ctx.reply(
            `Текст поста:\n\n${post.text}`,
            Markup.inlineKeyboard([
                [Markup.button.callback("✏ Изменить текст", "edit_text")],
                [Markup.button.callback("➡ Далее к медиа", "to_media")],
            ])
        );

        ctx.wizard.next();
    }

@Action("edit_text")
async onEditText(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        await ctx.reply("Отправьте новый текст поста:");
        this.state.action = "wait_new_text";
    }

    @WizardStep(2)
    async step2(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        if (this.state.action === "wait_new_text" && this.message?.text) {
            this.state.text = ctx.message.text;

            await ctx.reply(
                `Новый текст:\n\n${this.updatedText}`,
                Markup.inlineKeyboard([
                    [Markup.button.callback("💾 Сохранить текст", "save_text")],
                    [Markup.button.callback("↩ Отменить", "cancel_text")],
                ])
            );
            return;
        }

        await ctx.answerCbQuery();
        await ctx.reply("Переходим к редактированию медиа…");
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    @Action("save_text")
    async saveText(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Текст сохранён ✔");
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    @Action("cancel_text")
async cancelText(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Изменения текста отменены");
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    private async showMedia(ctx: Scenes.WizardContext) {
    this.init(ctx)
        if (this.state.media.length === 0) {
            await ctx.reply("Медиа нет. Добавить новые?", Markup.inlineKeyboard([
                [Markup.button.callback("➕ Добавить медиа", "add_media")],
                [Markup.button.callback("➡ Далее", "final")]
            ]));
            return;
        }

        const currentPhoto = this.state.media[0];

        await ctx.replyWithPhoto(currentPhoto, {
            caption: "Оставить это фото?",
            ...Markup.inlineKeyboard([
                [Markup.button.callback("✔ Оставить", "keep_photo")],
                [Markup.button.callback("❌ Удалить", "del_photo")],
            ])
        });
    }

    @Action("keep_photo")
async keepPhoto(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        this.state.media.push(this.state.media.shift()); 
        await ctx.answerCbQuery();
        await this.nextMediaOrFinish(ctx);
    }

    @Action("del_photo")
async delPhoto(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        this.state.media.shift(); 
        await ctx.answerCbQuery("Удалено");
        await this.nextMediaOrFinish(ctx);
    }

    private async nextMediaOrFinish(ctx: Scenes.WizardContext) {
    this.init(ctx)
        if (this.state.media.length > 0) {
            await this.showMedia(ctx);
        } else {
            await ctx.reply(
                "Хотите добавить новые медиа?",
                Markup.inlineKeyboard([
                    [Markup.button.callback("➕ Добавить", "add_media")],
                    [Markup.button.callback("➡ Далее", "final")],
                ])
            );
        }
    }

    @Action("add_media")
async addMedia(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        await ctx.reply("Отправьте новые медиа файлы. Когда закончите — напишите 'стоп'.");
        this.state.action = "add_media";
    }

    @WizardStep(4)
async step4(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
        if (this.state.action === "add_media") {
            if (this.message?.text === "стоп") {
                await ctx.reply("Медиа добавлены");
                ctx.wizard.next();
                await this.showFinal(ctx);
                return;
            }

            if (ctx.message?.photo) {
                const fileId = ctx.message.photo.pop().file_id;
                this.updatedMedia.push(fileId);
                await ctx.reply("Фото добавлено. Ещё?");
                return;
            }
        }
    }

    private async showFinal(ctx: Scenes.WizardContext) {
    this.init(ctx)
        await ctx.reply("Ваш обновлённый пост:");

        if (this.state.media.length > 1) {
            await ctx.replyWithMediaGroup(
                this.state.media.map(p => ({ type: "photo", media: p }))
            );
        } else if (this.state.media.length === 1) {
            await ctx.replyWithPhoto(this.state.media[0]);
        }

        await ctx.reply(
            this.state.text,
            Markup.inlineKeyboard([
                [Markup.button.callback("💾 Сохранить изменения", "confirm")],
                [Markup.button.callback("❌ Отмена", "cancel_all")],
            ])
        );
    }

    @Action("final")
    async final(@Ctx() ctx: Scenes.WizardContext) {
        await this.showFinal(ctx);
    }

    @Action("confirm")
async confirm(@Ctx() ctx: Scenes.WizardContext) {
    this.init(ctx)
    const data = this.state
    await axios.update(`${config.get<string>('GATE_URL')}/posts`, {
            data
        })
        await ctx.reply("Изменения сохранены ✔");
        return ctx.scene.leave();
    }

    @Action("cancel_all")
    async cancelAll(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply("Изменения отменены ❌");
        return ctx.scene.leave();
    }
}
