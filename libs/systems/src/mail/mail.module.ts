import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {PostScheduler} from "./scheduler";
import { MailProcessor } from "./mail.processor";
import {MailService} from "./mail.service";
import {BullModule} from "@nestjs/bull";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".env/gate/mail.env", isGlobal: true,
        }),
        BullModule.registerQueue({
            name: 'mail',
        }),
    ],
    providers: [
        PostScheduler, MailProcessor, MailService
    ]
})

export class EmailModule {}