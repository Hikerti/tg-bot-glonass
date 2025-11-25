import { Injectable } from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {DeleteObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

@Injectable()
export class S3Service {
    private s3: S3Client;
    private bucket: string;

    constructor(private readonly config: ConfigService) {
        this.s3 = new S3Client({
            region: this.config.getOrThrow('S3_REGION'),
            credentials: {
                accessKeyId: this.config.getOrThrow('S3_USER'),
                secretAccessKey: this.config.getOrThrow('S3_PASSWORD'),
            },
            endpoint: this.config.getOrThrow('S3_ENDPOINT'),
            forcePathStyle: true,
        });

        this.bucket = this.config.getOrThrow('S3_BUCKET')
    }

    async uploadFile(file: Express.Multer.File) {
        const fileName = `${Date.now()}-${file.originalname}`;

        try {
            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }),
            )

            return {
                url: `${this.config.get('S3_ENDPOINT')}/${this.bucket}/${fileName}`,
                key: fileName,
            };
        } catch (e) {
            console.error('❌ S3 Upload Error:', e);
            throw new Error('Failed to upload file to storage');
        }
    }

    async deleteFile(key: string) {
        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
        } catch (e) {
            console.error('❌ S3 Deleted Error:', e);
            throw new Error('Failed to deleted file to storage');
        }
    }
}