import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;
        console.log(databaseUrl)

        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined');
        }
        const adapter = new PrismaPg({ url: databaseUrl });
        super({ adapter });
    }
}
