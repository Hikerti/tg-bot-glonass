import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { session } from "telegraf";
import {ClientService} from "./client.service";

@Module({
    imports: [
        ConfigModule,
        TelegrafModule.forRootAsync({
            botName: 'clientBot',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                token: config.get<string>('CLIENT_BOT_TOKEN')!,
                include: [ClientService],
                middlewares: [session()],
            }),
        }),
    ],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientBotModule {}
