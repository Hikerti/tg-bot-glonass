import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {PostScheduler} from "./scheduler";
import { MailProcessor } from "./mail.processor";
import {MailService} from "./mail.service";
import {BullModule} from "@nestjs/bull";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@domains";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".envs/local/gate/mail.env", isGlobal: true,
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