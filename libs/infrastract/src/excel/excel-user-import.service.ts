import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import * as XLSX from 'xlsx';
import axios from "axios";

export interface ExcelUserFromImport  {
    name: string,
    email: string
}

@Injectable()
export class ExcelUserImportService {
    constructor(private readonly config: ConfigService) {
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async importUserFromExcel(buffer: Buffer) {
        try {
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const rows: ExcelUserFromImport[] = XLSX.utils.sheet_to_json(sheet);

            const validUsers = rows.filter(
                (u) => u.name?.trim() && u.email?.trim() && this.isValidEmail(u.email)
            );

            const gateUrl = this.config.get<string>('GATE_URL');

            await axios.post(`${gateUrl}/users/bulk`, { users: validUsers });

            return { message: 'Импорт завершён', count: validUsers.length }

        } catch (e) {
            console.error(e);
            console.log("Ошибка при обработке файла ❌");
        }
    }
}