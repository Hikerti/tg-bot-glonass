import { Module } from '@nestjs/common';
import {S3Controller} from "./s3.controller";
import {S3Service} from "@infrastract";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: 'envs/database/minio.env'
        })
    ],
    providers: [S3Service],
    controllers: [S3Controller]
})
export class S3Module {}
