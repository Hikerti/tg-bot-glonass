import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {PostScheduler} from "./scheduler";
import { MailProcessor } from "./mail.processor";
import {MailService} from "./mail.service";
import {BullModule} from "@nestjs/bull";
import {User} from "../../../domains/src/user/user.entites";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ["envs/local/gate/mail.env", 'envs/local/bot/bot.env'], isGlobal: true,
        }),
        TypeOrmModule.forFeature([User]),
        BullModule.registerQueue({
            name: 'mail',
        }),
    ],
    providers: [
        PostScheduler, MailProcessor, MailService
    ]
})

export class EmailModule {}