import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {AdminBotModule} from "./bot-admin";
import {ClientBotModule} from "./bot-client";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: 'envs/bot/bot.env' }),
        AdminBotModule,
        ClientBotModule
    ],
})
export class AppModule {}