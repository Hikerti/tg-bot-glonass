import {Command, Update} from "nestjs-telegraf";

@Update()
export class AdminExcelService {
    constructor() {
    }

    @Command('get_excel_table')
    async getUsersFromExcel() {}
}