import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminGeneralUpdateService } from "./updates";
import { AdminUserService, AdminUsersWizardService } from "./users";
import { AdminPostsService } from "./posts";
import { AdminExcelService } from "./excel";

@Module({
    imports: [
        ConfigModule,
    ],
    providers: [
        AdminGeneralUpdateService,
        AdminUserService,
        AdminPostsService,
        AdminExcelService,
        AdminUsersWizardService
    ],
    exports: [
        AdminGeneralUpdateService,
        AdminUserService,
        AdminPostsService,
        AdminExcelService,
        AdminUsersWizardService
    ],
})
export class AdminBotModule {}
