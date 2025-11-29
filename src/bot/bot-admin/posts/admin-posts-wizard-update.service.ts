import { Wizard, WizardStep, Ctx, Action } from 'nestjs-telegraf';
import {Scenes, Markup, Context} from 'telegraf';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectBot } from 'nestjs-telegraf';
import { Message } from "telegraf/types";
import { PostDTO } from "@domains";
import {S3Service} from "@infrastract";
import {AdminGetMedia} from "./admin-get-media";

interface UpdatePostWizardState {
    postId?: string;
    text?: string;
    media?: string[];
    newMedia?: string[];
    action?: string | null;
}

export interface SessionData extends Scenes.WizardSession {
    post?: PostDTO;
}

export interface MyContext extends Scenes.WizardContext {
    session: SessionData;
}

@Wizard('update-post-wizard')
export class AdminPostsWizardUpdateService extends AdminGetMedia {
    constructor(
        protected readonly config: ConfigService,
        @InjectBot('adminBot') protected readonly bot: Telegraf<Context>,
        protected readonly s3Service: S3Service,
    ) {
        super(config, bot, s3Service);
    }

    private state(ctx: MyContext): UpdatePostWizardState {
        const s = ctx.wizard.state as UpdatePostWizardState;
        s.media ??= [];
        s.newMedia ??= [];
        s.action ??= null;
        return s;
    }

    @WizardStep(1)
    async step1(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        const post = ctx.session.post;

        if (!post) {
            await ctx.reply('Не найден пост в сессии. Откройте список постов и выберите редактирование.');
            return ctx.scene.leave();
        }

        s.postId = post.id;
        s.text = post.text ?? '';
        s.media = Array.isArray(post.media) ? [...post.media] : [];

        await ctx.reply(
            `Текущий текст поста:\n\n${s.text}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✏️ Изменить текст', 'edit_text')],
                [Markup.button.callback('➡️ Перейти к медиа', 'to_media')],
            ])
        );

        ctx.wizard.next();
    }

    @Action('edit_text')
    async onEditText(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        s.action = 'wait_new_text';
        await ctx.reply('Отправьте новый текст поста:');
    }

    @WizardStep(2)
    async step2(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);

        if (s.action === 'wait_new_text' && ctx.message && 'text' in ctx.message) {
            s.text = (ctx.message as Message.TextMessage).text ?? s.text;
            s.action = null;

            await ctx.reply(
                `Новый текст:\n\n${s.text}`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('💾 Сохранить текст', 'save_text')],
                    [Markup.button.callback('↩️ Отменить', 'cancel_text')],
                ])
            );
            return;
        }

        await ctx.answerCbQuery().catch(() => {});
        await ctx.reply('Переходим к редактированию медиа...');
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    @Action('save_text')
    async saveText(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        s.action = null;
        await ctx.reply('Текст сохранён ✔');
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    @Action('cancel_text')
    async cancelText(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);

        const post = ctx.session.post;
        s.text = post?.text ?? s.text;
        s.action = null;

        await ctx.reply('Изменения текста отменены');
        ctx.wizard.next();
        await this.showMedia(ctx);
    }

    private async showMedia(ctx: MyContext) {
        const s = this.state(ctx);

        if ((s.media?.length ?? 0) === 0 && (s.newMedia?.length ?? 0) === 0) {
            await ctx.reply(
                'Медиа в посте отсутствуют. Хотите добавить новые?',
                Markup.inlineKeyboard([
                    [Markup.button.callback('➕ Добавить медиа', 'add_media')],
                    [Markup.button.callback('➡️ Далее', 'final')],
                ])
            );
            return;
        }

        const combined = [...(s.media ?? []), ...(s.newMedia ?? [])];
        const current = combined[0];

        const lower = (current ?? '').toLowerCase();

        if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.includes('video')) {
            await ctx.replyWithVideo(current, {
                caption: 'Оставить этот файл?',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✔️ Оставить', 'keep_media')],
                    [Markup.button.callback('❌ Удалить', 'del_media')],
                ]),
            });
        } else if (lower.endsWith('.mp3') || lower.includes('audio')) {
            await ctx.replyWithAudio(current, { caption: 'Оставить этот файл?' });
            await ctx.reply(
                'Оставить этот файл?',
                Markup.inlineKeyboard([
                    [Markup.button.callback('✔️ Оставить', 'keep_media')],
                    [Markup.button.callback('❌ Удалить', 'del_media')],
                ])
            );
        } else if (lower.endsWith('.pdf') || lower.includes('document')) {
            await ctx.replyWithDocument(current, { caption: 'Оставить этот файл?' });
            await ctx.reply(
                'Оставить этот файл?',
                Markup.inlineKeyboard([
                    [Markup.button.callback('✔️ Оставить', 'keep_media')],
                    [Markup.button.callback('❌ Удалить', 'del_media')],
                ])
            );
        } else {
            await ctx.replyWithPhoto(current, {
                caption: 'Оставить это изображение?',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✔️ Оставить', 'keep_media')],
                    [Markup.button.callback('❌ Удалить', 'del_media')],
                ]),
            });
        }
    }

    @Action('keep_media')
    async keepMedia(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        const combined = [...(s.media ?? []), ...(s.newMedia ?? [])];

        const first = combined.shift();
        if (!first) {
            await ctx.answerCbQuery('Нет медиа');
            return this.nextMediaOrFinish(ctx);
        }

        if ((s.media ?? []).length > 0) {
            s.media!.push(s.media!.shift() as string);
        } else {
            s.newMedia!.push(s.newMedia!.shift() as string);
        }

        await ctx.answerCbQuery().catch(() => {});
        await this.nextMediaOrFinish(ctx);
    }

    @Action('del_media')
    async delMedia(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        if ((s.media ?? []).length > 0) s.media!.shift();
        else if ((s.newMedia ?? []).length > 0) s.newMedia!.shift();

        await ctx.answerCbQuery('Удалено').catch(() => {});
        await this.nextMediaOrFinish(ctx);
    }

    private async nextMediaOrFinish(ctx: MyContext) {
        const s = this.state(ctx);
        const combined = [...(s.media ?? []), ...(s.newMedia ?? [])];

        if (combined.length > 0) return this.showMedia(ctx);

        await ctx.reply(
            'Хотите добавить новые медиа?',
            Markup.inlineKeyboard([
                [Markup.button.callback('➕ Добавить', 'add_media')],
                [Markup.button.callback('➡️ Далее', 'final')],
            ])
        );
    }

    @Action('add_media')
    async addMedia(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        s.action = 'add_media';
        await ctx.reply("Отправьте новые медиа файлы. Когда закончите — напишите 'стоп'.");
    }

    @WizardStep(4)
    async stepAddMedia(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);
        if (s.action !== 'add_media') return;

        if (ctx.message && 'text' in ctx.message && ctx.message.text?.toLowerCase() === 'стоп') {
            s.action = null;
            await ctx.reply('Добавление медиа завершено.');
            ctx.wizard.next();
            return this.showFinal(ctx);
        }

        if (ctx.message) {
            const uploaded = await this.uploadMediaFromTelegram(ctx.message as Message).catch(async (e) => {
                console.error(e);
                await ctx.reply('Ошибка при загрузке файла.');
                return null;
            });

            if (uploaded) {
                s.newMedia!.push(uploaded.url);
                await ctx.reply('Медиа загружено ✔ Отправьте ещё или напишите "стоп"');
            }
        }
    }

    private async showFinal(ctx: MyContext) {
        const s = this.state(ctx);

        await ctx.reply('Ваш обновлённый пост:');

        const finalMedia = [...(s.media ?? []), ...(s.newMedia ?? [])];

        if (finalMedia.length > 1) {
            await ctx.replyWithMediaGroup(finalMedia.map((u) => ({ type: 'photo', media: u })) as any);
        } else if (finalMedia.length === 1) {
            const u = finalMedia[0];
            await ctx.replyWithPhoto(u).catch(async () => {
                await ctx.replyWithDocument(u).catch(() => {});
            });
        }

        await ctx.reply(
            s.text ?? '',
            Markup.inlineKeyboard([
                [Markup.button.callback('💾 Сохранить изменения', 'confirm')],
                [Markup.button.callback('❌ Отмена', 'cancel_all')],
            ])
        );
    }

    @Action('final')
    async final(@Ctx() ctx: MyContext) {
        await this.showFinal(ctx);
    }

    @Action('confirm')
    async confirm(@Ctx() ctx: MyContext) {
        const s = this.state(ctx);

        const payload = {
            text: s.text,
            media: [...(s.media ?? []), ...(s.newMedia ?? [])],
        };

        try {
            await axios.put(`${this.config.get<string>('GATE_URL')}/posts/${s.postId}`, payload);
            await ctx.reply('Изменения сохранены ✔');
        } catch (e) {
            console.error(e);
            await ctx.reply('Ошибка при сохранении изменений.');
        }

        return ctx.scene.leave();
    }

    @Action('cancel_all')
    async cancelAll(@Ctx() ctx: MyContext) {
        await ctx.reply('Изменения отменены ❌');
        return ctx.scene.leave();
    }
}
