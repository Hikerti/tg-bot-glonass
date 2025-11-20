import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Update()
export class ClientService {
    constructor(
        @InjectBot('clientBot')
        private clientBot: Telegraf,
    ) {}

    @Start()
    async onStart(@Ctx() ctx) {
        if (ctx.botInfo.username !== this.clientBot.botInfo?.username) return;

        ctx.reply('Это клиентский-бот 👑');
    }
}
