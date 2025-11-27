import {Update, Ctx, Start, InjectBot, Command, Action} from 'nestjs-telegraf';
import {Markup, Scenes, Telegraf} from 'telegraf';
import axios from "axios";
import {ConfigService} from "@nestjs/config";
import {UserDTO} from "@domains";
import {Context} from "telegraf";
import {OnModuleInit} from "@nestjs/common";

@Update()
export class ClientService implements OnModuleInit {
    constructor(
        @InjectBot('clientBot')
        private clientBot: Telegraf,
        private readonly config: ConfigService,
    ) {}

    async onModuleInit() {
        const adminCommands = [
            { command: 'start', description: 'Начало' },
            { command: 'remove_email', description: 'Удалить почту из рассылки' },
            { command: 'delete_profile', description: 'Удалить профиль для рассылки' },
        ];
        try {
            await this.clientBot.telegram.setMyCommands(adminCommands);
            console.log('Client bot: Меню команд успешно установлено.');
        } catch (error) {
            console.error('Ошибка установки меню команд:', error);
        }
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        const firstName = ctx.from?.first_name || 'дорогой пользователь';

        await ctx.reply(
            `Привет, **${firstName}**! 👋 \n\nЯ бот, который поможет тебе быть в курсе всех новостей.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('Начать подписку', 'next_step')],
            ])
        );
    }

    @Action('next_step')
    async onNextStep(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();

        await ctx.reply(
            'Перед тем как продолжить, пожалуйста, подтвердите, что вы **соглашаетесь на нашу информационную рассылку**. Мы обещаем не спамить! 😉',
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ Согласиться и подписаться', 'confirm_user')],
                [Markup.button.callback('❌ Отказаться', 'leave_user')],
            ])
        );
    }

    @Action('confirm_user')
    async onConfirmUser(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();

        const name = ctx.from?.first_name || 'Неизвестный';
        const tgId = ctx.from?.id;

        if (!tgId) {
            await ctx.reply('Извините, не удалось получить ваш Telegram ID. Попробуйте перезапустить бота.');
            return;
        }

        try {
            const response = await axios.post(`${this.config.get<string>('GATE_URL')}/users`, {
                data: {
                    name,
                    tgId: tgId.toString(),
                }
            });

            const userData: UserDTO = response.data;

            await ctx.reply(
                `🎉 Поздравляю, **${userData.name}**! Вы успешно подписаны на нашу рассылку.`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('✉️ Добавить email для дублирования рассылки', 'add_email')],
                    [Markup.button.callback('Продолжить без email', 'skip_email_prompt')],
                ])
            );
        } catch (error) {
            console.error(error);
            await ctx.reply('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
        }
    }

    @Action('add_email')
    async onAddEmail(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();

        await ctx.reply(
            'Отлично! Пожалуйста, **введите свою почту** в следующем сообщении.\n\n_После ввода email мы автоматически его сохраним._'
        );
    }

    @Action('skip_email_prompt')
    async onSkipEmailPrompt(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.reply('Хорошо! Вы всегда можете добавить email позже командой **/add_email**.');
    }

    @Action('leave_email')
    async onLeaveEmail(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.reply('Понимаю. Вы всегда можете вернуться к этому вопросу позже. Спасибо!');
    }

    @Action('leave_user')
    async onLeaveUser(@Ctx() ctx: Context) {
        await ctx.answerCbQuery();
        await ctx.reply('Очень жаль, что вы не с нами. Если передумаете, просто нажмите **/start**!');
    }

    @Command('add_email')
    async startAddEmailWizard(@Ctx() ctx: Scenes.WizardContext) {
        const tgId = ctx.from?.id?.toString();
        if (!tgId) return ctx.reply('Не удалось определить ваш ID.');

        try {
            const response = await axios.get(`${this.config.get<string>('GATE_URL')}/login/tg/${tgId}`);
            const data: UserDTO = response.data.data;

            await ctx.scene.enter('add-email-wizard', { id: data.id, currentEmail: data.email });
        } catch (e) {
            console.error(e);
            await ctx.reply('Сначала вам нужно зарегистрироваться. Нажмите **/start**.');
        }
    }

    @Command('remove_email')
    async removeEmail(@Ctx() ctx: Context) {
        const tgId = ctx.from?.id?.toString();
        if (!tgId) return ctx.reply('Не удалось определить ваш ID.');

        try {
            const response = await axios.get(`${this.config.get<string>('GATE_URL')}/login/tg/${tgId}`);
            const data: UserDTO = response.data.data;

            await axios.put(`${this.config.get<string>('GATE_URL')}/users/${data.id}`, {
                data: {
                    email: null,
                }
            });

            await ctx.reply(`✅ Ваш email **${data.email}** успешно удален из рассылки. Вы по-прежнему будете получать уведомления в Telegram.`);
        } catch (e) {
            console.error(e);
            await ctx.reply('Произошла ошибка при удалении email. Убедитесь, что вы зарегистрированы.');
        }
    }

    @Command('delete_profile')
    async deleteProfile(@Ctx() ctx: Context) {
        const tgId = ctx.from?.id?.toString();
        if (!tgId) return ctx.reply('Не удалось определить ваш ID.');

        try {
            const response = await axios.delete(`${this.config.get<string>('GATE_URL')}/logout/tg/${tgId}`);
            const data: UserDTO = response.data;
            await ctx.reply(`Спасибо, что были с нами, **${data.name}**. Ваш профиль и все данные успешно удалены. До свидания! 👋`);
        } catch (e) {
            console.error(e);
            await ctx.reply('Произошла ошибка при удалении профиля. Пожалуйста, попробуйте позже.');
        }
    }
}