import { Module } from "@nestjs/common";
import { AdminGeneralUpdateService } from "./updates";
import { AdminPostsService, AdminPostsWizardService } from "./posts";
import { AdminUserService, AdminUsersWizardService } from "./users";
import { AdminExcelService } from "./excel";
import {ExcelModule, S3Module} from "@infrastract";

@Module({
    imports: [S3Module, ExcelModule],

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
        AdminPostsService,
        AdminUserService,
        AdminExcelService,
    ]
})
export class AdminBotModule {}