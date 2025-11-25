import {Wizard, WizardStep, Ctx} from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { UserDTO } from '@domains';
import { CallbackQuery, Message } from "node_modules/telegraf/typings/core/types/typegram";
import {UserRole} from "@prisma/client";

interface CreateUserWizardState {
    name?: string;
    email?: string;
    tg_id?: string | null;
}

@Wizard('create-user-wizard', { botName: 'adminBot' })
export class AdminUsersWizardService {

    private message?: Message.TextMessage;
    private callbackQuery?: CallbackQuery.DataQuery;
    private state!: CreateUserWizardState;

    constructor(private readonly config: ConfigService) {}

    private init(ctx: Scenes.WizardContext) {
        this.message = ctx.message as Message.TextMessage;
        this.callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
        this.state = ctx.wizard.state as CreateUserWizardState;
    }

    @WizardStep(1)
    async step1(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);
        await ctx.reply('Введите ФИО пользователя, которое хотите добавить в базу:');
        return ctx.wizard.next();
    }

    @WizardStep(2)
    async step2(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) {
            return ctx.reply('Имя не может быть пустым. Пожалуйста, введите ФИО снова:');
        }

        this.state.name = text;
        await ctx.reply('Введите email пользователя, которое хотите добавить в базу:');
        return ctx.wizard.next();
    }

    @WizardStep(3)
    async step3(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        const text = this.message?.text?.trim();
        if (!text) {
            return ctx.reply('Email не может быть пустым. Пожалуйста, введите email снова:');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
            return ctx.reply('Некорректный формат email. Попробуйте снова:');
        }

        this.state.email = text;

        await ctx.reply(
            'Введите tgId пользователя (необязательно, можно пропустить):',
            Markup.inlineKeyboard([[Markup.button.callback('Пропустить', 'skip_tg_id')]])
        );

        return ctx.wizard.next();
    }

    @WizardStep(4)
    async step4(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        if (this.callbackQuery?.data === 'skip_tg_id') {
            this.state.tg_id = null;
            await ctx.answerCbQuery();
        }
        else if (this.message?.text) {
            this.state.tg_id = this.message.text.trim();
        }
        else {
            this.state.tg_id = null;
        }

        const { name, email, tg_id } = this.state;

        await ctx.reply(
            `Проверьте данные:\n\nИмя: ${name}\nEmail: ${email}\nTelegram ID: ${tg_id || '-'}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ Подтвердить', 'confirm_user')],
                [Markup.button.callback('❌ Отменить', 'cancel_user')],
            ])
        );

        return ctx.wizard.next();
    }

    @WizardStep(5)
    async step5(@Ctx() ctx: Scenes.WizardContext) {
        this.init(ctx);

        if (!this.callbackQuery) {
            return ctx.reply('Нажмите кнопку, чтобы подтвердить или отменить создание пользователя.');
        }

        const action = this.callbackQuery.data;
        const { name, email, tg_id } = this.state;

        if (action === 'confirm_user') {
            if (name && email) {
                const data: UserDTO.Create = { name, email, tgId: tg_id, role: 'client' as UserRole };

                try {
                    await axios.post(`${this.config.get<string>('GATE_URL')}/users`, data);
                    await ctx.reply(`Пользователь успешно создан!\nИмя: ${name}\nEmail: ${email}\nTelegram ID: ${tg_id || '-'}`);
                } catch (error) {
                    console.error('Ошибка при создании пользователя:', error.response?.data || error.message);
                    await ctx.reply('Не удалось создать пользователя.');
                }
            }
        } else {
            await ctx.reply('Создание пользователя отменено.');
        }

        await ctx.answerCbQuery();
        return ctx.scene.leave();
    }
}
