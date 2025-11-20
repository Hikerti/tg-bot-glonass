import {Update, Ctx, Start, InjectBot, Command, Action} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';

import {UserDTO} from "@domains";

import axios from "axios";

import {ConfigService} from "@nestjs/config";


@Update()
export class AdminService {
    private currentPage = 1;

    constructor(
        private config: ConfigService,
        @InjectBot('adminBot')
        private adminBot: Telegraf,
    ) {}

    @Start()
    async onStart(@Ctx() ctx) {
        if (ctx.botInfo.username !== this.adminBot.botInfo?.username) return;

        ctx.reply('Добро пожаловать в админ панель Glonass-bot.\n' +
            'Если хочешь узнат что я умею, напиши /help');
    }

    @Command('help')
    async help(@Ctx() ctx) {
        ctx.reply(
            'Доступные команды:\n' +
            '/userList - показать всех пользователей\n' +
            '/createPostForMail - отправить сообщение всем\n' +
            '/start - статистика бота'
        )
    }

    @Command('userList')
    async getUsersList(@Ctx() ctx) {
        this.currentPage = 1;
        await this.sendUsersPage(ctx, this.currentPage);
    }

    @Action('next_users')
    async nextPage(@Ctx() ctx) {
        this.currentPage++;
        await this.sendUsersPage(ctx, this.currentPage);
    }

    @Action('prev_users')
    async prevPage(@Ctx() ctx) {
        if (this.currentPage > 1) this.currentPage--;
        await this.sendUsersPage(ctx, this.currentPage);
    }

    private async sendUsersPage(ctx, page: number) {
        const limit = 10;
        try {
            const response = await axios.get(`${this.config.get<string>('GATE_URL')}/users`, {
                params: { page, limit },
            });

            const data = response.data;

            const message = data.items
                .map((user: UserDTO, index: number) =>
                    `${(page - 1) * limit + index + 1}. ${user.name} (${user.email ?? 'нет почты'}) (${user.tgId ?? 'нет телеграмма'})`
                )
                .join('\n');

            await ctx.reply(`Всего пользователей: ${data.total}\n\n${message}`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Назад', 'prev_users'), Markup.button.callback('Вперёд ➡️', 'next_users')]
                ])
            );
        } catch (e) {
            console.error('Ошибка при получении пользователей:', e.response?.data || e.message);
            await ctx.reply('Не удалось загрузить список пользователей.');
        }
    }
}
