import {Command, InjectBot, Update} from "nestjs-telegraf";
import {Context, Telegraf} from "telegraf";

@Update()
export class AdminExcelService {
    constructor(@InjectBot('adminBot') private readonly bot: Telegraf<Context>) {
    }

    @Command('get_excel_table')
    async getUsersFromExcel() {}
}