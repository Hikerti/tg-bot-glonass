import {Global, Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";
import {VkProcessor} from "./vk.processor";
import {VkScheduler} from "./vk.scheduler";
import {VkService} from "./vk.service";
import {VkPhotoService} from "./vk-photo.service";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ["envs/local/gate/vk.env", 'envs/local/bot/bot.env'], isGlobal: true,
        }),
        BullModule.registerQueue({
            name: 'vk',
        }),
    ],
    providers: [VkProcessor, VkScheduler, VkService, VkPhotoService],
    exports: [VkProcessor, VkScheduler, VkService, VkPhotoService]
})

export class VkModule {}