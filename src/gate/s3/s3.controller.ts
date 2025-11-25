import {Controller, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import {S3Service} from "@infrastract";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('upload')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) {}

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.s3Service.uploadFile(file)
    }
}