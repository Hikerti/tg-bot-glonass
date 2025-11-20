import { Update, Ctx, Start, InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Update()
export class AdminService {
    constructor(
        @InjectBot('adminBot')
        private adminBot: Telegraf,
    ) {}

    @Start()
    async onStart(@Ctx() ctx) {
        if (ctx.botInfo.username !== this.adminBot.botInfo?.username) return;

        ctx.reply('Это админ-бот 👑');
    }
}
