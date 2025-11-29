import {Injectable, OnModuleInit} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {
    CreateBucketCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";

interface S3UploadData {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}

@Injectable()
export class S3Service implements OnModuleInit {
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

    async onModuleInit() {
        await this.ensureBucketExists();
    }

    async uploadFile(file: S3UploadData) {
        const fileName = `${Date.now()}-${file.originalname}`;

        try {
            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read',
                }),
            )

            return {
                url: `http://glonass_media/${this.bucket}/${fileName}`,
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

    async ensureBucketExists() {

        try {
            await this.s3.send(new HeadBucketCommand({Bucket: this.bucket}))
            console.log(`✅ S3 Bucket "${this.bucket}" already exists.`);
        } catch (error) {
            console.log(`⏳ Bucket "${this.bucket}" not found. Creating...`);
            await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
            console.log(`✅ Bucket "${this.bucket}" created.`);

            const publicPolicy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: ["s3:GetObject"],
                        Effect: "Allow",
                        Principal: "*",
                        Resource: [`arn:aws:s3:::${this.bucket}/*`],
                    },
                ],
            };

            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: 'policy.json',
                Body: JSON.stringify(publicPolicy),
                ContentType: 'application/json',
            }));

            console.log(`✅ Public policy applied to "${this.bucket}".`);
        }
    }
}