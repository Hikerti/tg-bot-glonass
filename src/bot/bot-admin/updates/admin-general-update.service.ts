import {Command, Ctx, InjectBot, Start, Update} from "nestjs-telegraf";
import {Telegraf} from "telegraf";
import {OnModuleInit} from "@nestjs/common";

@Update()
export class AdminGeneralUpdateService implements OnModuleInit {
    constructor(
        @InjectBot('adminBot')
        private readonly adminBot: Telegraf,
    ) {}

    async onModuleInit() {
        const adminCommands = [
            { command: 'start', description: 'Начало' },
            { command: 'help', description: 'Список всех команд' },
            { command: 'get_users', description: 'Получение списка всех пользователей' },
            { command: 'create_user', description: 'Добавить пользователя для рассылки' },
            { command: 'create_letter', description: 'Создание контента для рассылки на почту' },
            { command: 'get_posts_list', description: 'Получение списка постов для рассылки на почту' },
            { command: 'create_tg_post', description: 'Создание контента для рассылки в телеграмм' },
            { command: 'get_posts_tg', description: 'Получение списка постов для рассылки в телеграмм' },
            { command: 'get_excel_table', description: 'Получение базы пользователей в виде excel' },
        ];

        try {
            await this.adminBot.telegram.setMyCommands(adminCommands);
            console.log('Admin bot: Меню команд успешно установлено.');
        } catch (error) {
            console.error('Ошибка установки меню команд:', error);
        }
    }

    @Start()
    async onStart(@Ctx() ctx) {
        if (ctx.botInfo.username !== this.adminBot.botInfo?.username) return;

        await ctx.deleteMessage();

        ctx.reply('Добро пожаловать в админ панель Glonass-bot.\n' +
            'Если хочешь узнат что я умею, напиши /help');
    }

    @Command('help')
    async help(@Ctx() ctx) {
        await ctx.deleteMessage();

        ctx.reply(
            'Доступные команды:\n' +
            '/userList - показать всех пользователей\n' +
            '/createPost - отправить сообщение всем\n' +
            '/start - статистика бота'
        )
    }
}