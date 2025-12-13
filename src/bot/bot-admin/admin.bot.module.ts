import { Module } from "@nestjs/common";
import { AdminGeneralUpdateService } from "./updates";
import { AdminPostsService, AdminPostsWizardService, AdminPostsWizardUpdateService } from "./posts";
import { AdminUserService, AdminUsersWizardService } from "./users";
import { AdminExcelService } from "./excel";
import {ExcelModule, S3Module} from "@infrastract";
import { AiModule } from "@integrations";
import {BroadcastModule, EmailModule, VkModule} from "@systems";

@Module({
    imports: [S3Module, ExcelModule, AiModule, BroadcastModule, EmailModule, VkModule],

    providers: [
        AdminPostsWizardUpdateService,
        AdminGeneralUpdateService,
        AdminPostsWizardService,
        AdminUsersWizardService,
        AdminPostsService,
        AdminUserService,
        AdminExcelService,
    ],
    exports: [
        AdminPostsWizardUpdateService,
        AdminGeneralUpdateService,
        AdminPostsWizardService,
        AdminUsersWizardService,
        AdminPostsService,
        AdminUserService,
        AdminExcelService,
    ]
})
export class AdminBotModule {}