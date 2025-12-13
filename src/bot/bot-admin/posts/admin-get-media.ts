import {Message} from "telegraf/types";
import axios from "axios";
import {ConfigService} from "@nestjs/config";
import {InjectBot} from "nestjs-telegraf";
import {Context, Telegraf} from "telegraf";
import {S3Service} from "@infrastract";

export class AdminGetMedia {
    constructor(
        protected readonly config: ConfigService,
        @InjectBot('adminBot') protected readonly bot: Telegraf<Context>,
        protected readonly s3Service: S3Service
    ) {
    }

    protected extractMediaFileId(msg: Message): string | null {
        if ("photo" in msg) return msg.photo[msg.photo.length - 1].file_id;
        if ("video" in msg) return msg.video.file_id;
        if ("audio" in msg) return msg.audio.file_id;
        if ("document" in msg) return msg.document.file_id;
        return null;
    }

    protected getMimeTypeFromMessage(msg: Message): string | null {
        if ("photo" in msg) return 'image/jpeg';
        if ("video" in msg) return msg.video.mime_type || 'video/mp4';
        if ("audio" in msg) return msg.audio.mime_type || 'audio/mpeg';
        if ("document" in msg) return msg.document.mime_type || 'application/octet-stream';
        return null;
    }

    protected getFileNameFromMessage(msg: Message): string | null {
        if ("photo" in msg) return `photo_${msg.message_id}.jpg`;
        if ("video" in msg) return msg.video.file_name || `video_${msg.message_id}.mp4`;
        if ("audio" in msg) return msg.audio.file_name || `audio_${msg.message_id}.mp3`;
        if ("document" in msg) return msg.document.file_name || `document_${msg.message_id}.dat`;
        return null;
    }
    protected async uploadMediaFromTelegram(msg: Message): Promise<{ url: string } | null> {
        const fileId = this.extractMediaFileId(msg);
        if (!fileId) return null;

        const tgFile = await this.bot.telegram.getFile(fileId);
        const filePath = tgFile.file_path as string;
        if (!filePath) return null;

        const token = this.config.get<string>('ADMIN_BOT_TOKEN');
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(fileResp.data);

        const mimeType = this.getMimeTypeFromMessage(msg) || 'application/octet-stream';
        const originalname = this.getFileNameFromMessage(msg) || `${fileId}`;

        const result = await this.s3Service.uploadFile({ buffer, originalname, mimetype: mimeType });

        return result && result.url ? { url: result.url } : null;
    }
}