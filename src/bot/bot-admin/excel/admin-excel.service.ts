import {Command, Ctx, InjectBot, Update} from "nestjs-telegraf";
import {Context, Telegraf} from "telegraf";
import {ExcelUserExportService, ExcelUserImportService} from "@infrastract";

@Update()
export class AdminExcelService {

    constructor(
        private importer: ExcelUserImportService,
        private exporter: ExcelUserExportService,
        @InjectBot('adminBot') private readonly bot: Telegraf<Context>
    ) {}

    @Command('get_excel_table')
    async getUsersFromExcel(@Ctx() ctx: Context) {
        try {
            const buffer = await this.exporter.exportUserFromExcel();

            if (!buffer) {
                await ctx.reply('Нет пользователей для выгрузки ❌');
            }

            await ctx.replyWithDocument({
                source: buffer,
                filename: 'users.xlsx',
            });
        } catch (e) {
            console.error(e);
            await ctx.reply('Не удалось выгрузить Excel файл ❌');
        }
    }

    @Command('create_users_from_table')
    async createUsersFromExcel(@Ctx() ctx: Context) {
        await ctx.reply('Отправьте Excel-файл с пользователями (.xlsx) для импорта');

        this.bot.on('document', async (ctxDoc) => {
            try {
                const file = ctxDoc.message.document;

                if (file.file_name !== undefined && !file.file_name.endsWith('.xlsx')) {
                    await ctxDoc.reply('Пожалуйста, отправьте файл Excel (.xlsx)');
                }

                const fileLink = await ctxDoc.telegram.getFileLink(file.file_id);
                const buffer = await fetch(fileLink.href).then(res => res.arrayBuffer());

                const result = await this.importer.importUserFromExcel(Buffer.from(buffer));

                if (result) {
                    await ctxDoc.reply(`Импорт завершён ✅\nСоздано пользователей: ${result.count}`);
                }
            } catch (e) {
                await ctxDoc.reply('Ошибка при обработке файла ❌');
            }
        })
    }
}