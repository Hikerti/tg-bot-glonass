import {Module} from "@nestjs/common";
import {ExcelUserImportService} from "./excel-user-import.service";
import {ExcelUserExportService} from "./excel-user-export.service";

@Module({
    providers: [ExcelUserImportService, ExcelUserExportService],
})

export class ExcelModule {}