import { BullModule } from "@nestjs/bull";
import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {BroadcastProcessor} from "./broadcast.processor";
import {BroadcastService} from "./broadcast.service";
import {BroadcastScheduler} from "./broadcast.scheduler";

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'broadcast',
        }),
        ConfigModule.forRoot({
            envFilePath: ["envs/local/gate/mail.env", 'envs/local/bot/bot.env'], isGlobal: true,
        }),
    ],
    providers: [
        BroadcastProcessor,
        BroadcastScheduler,
        BroadcastService
    ],
    exports: [
        BroadcastProcessor,
        BroadcastScheduler,
        BroadcastService
    ]
})

export class BroadcastModule {}