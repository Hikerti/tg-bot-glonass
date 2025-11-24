import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminBotModule } from "./bot-admin";
import { ClientBotModule } from "./bot-client";
import {session} from "telegraf";

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: 'envs/bot/bot.env', isGlobal: true }),

        TelegrafModule.forRootAsync({
            botName: 'clientBot',
            imports: [ClientBotModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                token: config.get('CLIENT_BOT_TOKEN')!,
                include: [ClientBotModule],
                middlewares: [session()],
            }),
        }),

        TelegrafModule.forRootAsync({
            botName: 'adminBot',
            imports: [AdminBotModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                token: config.get('ADMIN_BOT_TOKEN')!,
                include: [AdminBotModule],
                middlewares: [session()],
            }),
        }),
    ],
})
export class AppModule {}
