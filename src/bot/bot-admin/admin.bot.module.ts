import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {AdminGeneralUpdateService} from "./updates";
import {AdminUserService} from "./users";
import {AdminPostsService} from "./posts";
import {AdminExcelService} from "./excel";

@Module({
    imports: [ConfigModule],
    providers: [AdminGeneralUpdateService, AdminUserService, AdminPostsService, AdminExcelService],
    exports: [AdminGeneralUpdateService, AdminUserService, AdminPostsService, AdminExcelService],
})
export class AdminBotModule {}