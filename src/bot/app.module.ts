import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { AdminService } from './bot-admin';
import { ClientService } from './bot-client';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: 'envs/bot/bot.env',
            isGlobal: true,
        }),

        TelegrafModule.forRootAsync({
            botName: 'adminBot',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                token: configService.get<string>('ADMIN_BOT_TOKEN')!,
            }),
        }),

        TelegrafModule.forRootAsync({
            botName: 'clientBot',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                token: configService.get<string>('CLIENT_BOT_TOKEN')!,
            }),
        }),
    ],
    providers: [AdminService, ClientService],
})
export class AppModule {}
