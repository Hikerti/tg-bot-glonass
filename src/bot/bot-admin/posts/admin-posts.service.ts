import {Action, Command, Ctx, InjectBot, Update} from "nestjs-telegraf";
import {ConfigService} from "@nestjs/config";
import axios from "axios";
import {PaginationType} from "@shared";
import {PostDTO} from "@domains";
import {Context, Markup, Scenes, Telegraf} from "telegraf";
import {PostType} from "@prisma/client";
import {InputMediaPhoto} from "telegraf/types";

@Update()
export class AdminPostsService {
    private page = 1
    constructor(private config: ConfigService, @InjectBot('adminBot') private readonly bot: Telegraf<Context>) {}

    private async sendPosts(ctx, page: number, typePost: PostType) {
        ctx.deleteMessage()

        const limit = 1
        try {
            const response = await axios.get(`${this.config.get<string>('GATE_URL')}/posts`, {
                method: "GET",
                params: {
                    page, limit, typePost
                },
            })

            const data: PaginationType<PostDTO> = response.data;
            const mediaGroup = data.items[0].media.map(url => {
                return { type: 'photo', media: url } as InputMediaPhoto;
            });

            await ctx.replyWithMediaGroup(mediaGroup);

            await ctx.reply(data.items[0].text, Markup.inlineKeyboard([
                [Markup.button.callback('Изменить содержимое', 'edit_post')],
                [Markup.button.callback('⬅️ Назад', 'prev_users')],
                !data.isLast ? [Markup.button.callback('Вперёд ➡️', 'next_post')] : [],
            ]));

            ctx.session.post = data.items[0];
        } catch (e) {
            ctx.reply('Пост не загрузился')
            console.error(e);
        }
    }

    @Action('edit_post')
    async editPost(@Ctx() ctx) {
        if (!ctx.session.post) {
            return ctx.reply("Пост не найден в сессии");
        }
        await ctx.scene.enter("update-post-wizard");
    }

    @Action('next_post')
    async nextPost(@Ctx() ctx: Context) {
        this.page++;
        await this.sendPosts(ctx, this.page, 'mail')
    }
    

    @Action('prev_post')
    async prevPost(@Ctx() ctx: Context) {
        if (this.page > 1) this.page--;
        await this.sendPosts(ctx, this.page, 'mail')
    }

    @Action('next_tg_post')
    async nextTgPost(@Ctx() ctx: Context) {
        this.page++;
        await this.sendPosts(ctx, this.page, 'tg')
    }

    @Action('prev_tg_post')
    async prevTgPost(@Ctx() ctx: Context) {
        if (this.page > 1) this.page--;
        await this.sendPosts(ctx, this.page, 'tg')
    }

    @Command('get_posts_list')
    async getPostsList(@Ctx() ctx: Context) {
        this.page = 1;
        await this.sendPosts(ctx, this.page, 'mail')
    }

    @Command('get_posts_tg')
    async getPostListTg(@Ctx() ctx: Context) {
        this.page = 1;
        await this.sendPosts(ctx, this.page, 'tg')
    }

    @Command('create_post')
    async createPostTg(@Ctx() ctx: Scenes.WizardContext) {
        if (!ctx.scene) {
            return;
        }
        await ctx.scene.enter('create-post-wizard');
    }
}