import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VkPhotoService {
    private readonly logger = new Logger(VkPhotoService.name);
    private readonly axiosInstance: AxiosInstance;
    private readonly groupId: number;

    constructor(private config: ConfigService) {
        this.groupId = Number(this.config.get<string>('VK_GROUP_ID'));
        this.axiosInstance = axios.create({
            baseURL: 'https://api.vk.com/method/',
            params: {
                access_token: this.config.get<string>('VK_ACCESS_TOKEN'),
                v: '5.131',
            },
        });
    }

    async uploadPhotos(urls: string[]): Promise<string> {
        const attachments: string[] = [];
        for (const url of urls) {
            try {
                const attachment = await this.uploadSinglePhoto(url);
                attachments.push(attachment);
            } catch (e) {
                this.logger.error(`Ошибка загрузки фото VK: ${e.message}`, e.stack);
            }
        }
        return attachments.join(',');
    }

    private async uploadSinglePhoto(url: string): Promise<string> {
        const { upload_url } = await this.getUploadServer();

        const response = await axios.get(url, { responseType: 'stream' });

        const form = new FormData();
        form.append('file1', response.data, { filename: 'photo.jpg' });

        const uploadResponse = await axios.post(upload_url, form, {
            headers: form.getHeaders(),
        });

        const savedPhoto = await this.savePhoto(uploadResponse.data);

        return `photo${savedPhoto.owner_id}_${savedPhoto.id}`;
    }


    private async getUploadServer(): Promise<{ upload_url: string }> {
        const res = await this.axiosInstance.get('photos.getMessagesUploadServer', {
            params: { group_id: this.groupId },
        });
        return res.data.response;
    }

    private async savePhoto(uploadData: any): Promise<{ id: number; owner_id: number }> {
        const res = await this.axiosInstance.post('photos.saveMessagesPhoto', null, {
            params: {
                photo: uploadData.photo,
                server: uploadData.server,
                hash: uploadData.hash,
            },
        });
        return res.data.response[0];
    }
}
