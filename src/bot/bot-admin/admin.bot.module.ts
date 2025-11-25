import {ConfigModule, ConfigService} from "@nestjs/config";
import {Module} from "@nestjs/common";
import {AdminGeneralUpdateService} from "./updates";
import {AdminPostsService, AdminPostsWizardService} from "./posts";
import {AdminUserService, AdminUsersWizardService} from "./users";
import {AdminExcelService} from "./excel";
import {session} from "telegraf";
import {TelegrafModule} from "nestjs-telegraf";

@Module({
    imports: [
        ConfigModule,
        TelegrafModule.forRootAsync({
            botName: 'adminBot',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                token: config.get('ADMIN_BOT_TOKEN')!,
                include: [
                    AdminGeneralUpdateService,
                    AdminPostsWizardService,
                    AdminUsersWizardService,
                ],
                middlewares: [session()],
            }),
        }),
    ],
    providers: [
        AdminGeneralUpdateService,
        AdminPostsWizardService,
        AdminUsersWizardService,
        AdminPostsService,
        AdminUserService,
        AdminExcelService,
    ],
    exports: [
        AdminGeneralUpdateService,
        AdminPostsWizardService,
        AdminUsersWizardService,
    ]
})
export class AdminBotModule {}
