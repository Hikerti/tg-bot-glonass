import {Action, Command, Ctx, Update} from "nestjs-telegraf";
import {ConfigService} from "@nestjs/config";
import axios from "axios";
import {UserDTO} from "@domains";
import {Markup} from "telegraf";

@Update()
export class AdminUserService {
    private currentPage = 1

    constructor(private config: ConfigService) {

    }

    @Command('get_users')
    async getUsersList(@Ctx() ctx) {
        this.currentPage = 1;
        await this.sendUsersPage(ctx, this.currentPage);
    }

    @Command('create_user')
    async createUser(@Ctx() ctx) {

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
                method: "GET",
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