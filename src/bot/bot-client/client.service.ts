import {Update, Ctx, Start, InjectBot, Command} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Update()
export class ClientService {
    constructor(
        @InjectBot('clientBot')
        private clientBot: Telegraf,
    ) {}

    @Start()
    async onStart(@Ctx() ctx) {
        ctx.reply('Это клиентский-бот 👑');
    }

    @Command('help')
    async help(@Ctx() ctx) {
        ctx.reply(
            'Доступные команды:\n' +
            '/userList - показать всех пользователей\n'
        )
    }
}
