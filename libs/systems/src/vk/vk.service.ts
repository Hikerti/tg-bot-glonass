import { Injectable } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { ChannelJobData } from "../forwarding-message";
import { VkPhotoService } from "./vk-photo.service";
import { UserRole } from "@domains";

@Injectable()
export class VkService {
    private readonly axiosInstance: AxiosInstance;
    private readonly accessToken: string;
    private readonly groupId: number;
    private readonly apiVersion = '5.131';

    constructor(
        private config: ConfigService,
        private photoService: VkPhotoService
    ) {
        this.accessToken = this.config.get<string>('VK_ACCESS_TOKEN')!;
        this.groupId = Number(this.config.get<string>('VK_GROUP_ID'));

        this.axiosInstance = axios.create({
            baseURL: 'https://api.vk.com/method/',
            params: {
                access_token: this.accessToken,
                v: this.apiVersion,
            },
        });
    }

    public async send(data: ChannelJobData) {
        const { users, text, media, postToWall, postToMessage } = data;
        const attachment = media?.length
            ? await this.photoService.uploadPhotos(media)
            : undefined;

        if (postToMessage) {
            for (const user of users) {
                if (!user.vkId) continue;
                await this.sendMessage(user.vkId, text, attachment);
            }
        }

        if (postToWall) {
            await this.postToWall(text, attachment);
        }
    }

    private async isAllowed(userId: number): Promise<boolean> {
        try {
            const res = await this.axiosInstance.post('messages.isMessagesFromGroupAllowed', null, {
                params: { user_id: userId, group_id: this.groupId }
            });
            return res.data?.response?.is_allowed === 1;
        } catch {
            return false;
        }
    }

    private async sendMessage(userId: number, text: string, attachment?: string) {
        const allowed = await this.isAllowed(userId);
        if (!allowed) return;
        await this.axiosInstance.post('messages.send', null, {
            params: {
                user_id: 573825853,
                message: text,
                attachment,
                random_id: Date.now(),
                group_id: this.groupId,
            },
        });
    }

    public async syncSubscribers() {
        const gateUrl = this.config.get<string>('GATE_URL');

        const response = await axios.get(`${gateUrl}/users`, {
            params: { page: 1, limit: 9999999, role: UserRole.CLIENT }
        });
        const users = response.data.items || [];

        let offset = 0;
        const count = 1000;
        const allVkIds: number[] = [];

        while (true) {
            const res = await this.axiosInstance.get('groups.getMembers', {
                params: {
                    group_id: this.groupId,
                    offset,
                    count,
                    fields: 'id',
                },
            });

            const members: number[] = res.data.response.items;
            if (!members.length) break;

            allVkIds.push(...members);

            for (const vkId of members) {
                const existing = users.find(u => u.vkId === vkId);
                if (!existing) {
                    await axios.post(`${gateUrl}/users/vk`, { vkId, name: `VK User ${vkId}` });
                } else if (!existing.vkId) {
                    await axios.post(`${gateUrl}/users/vk`, { vkId, name: existing.name });
                }
            }

            offset += members.length;
            if (members.length < count) break;
        }

        const vkIdsToRemove = users
            .map(u => u.vkId)
            .filter(vkId => vkId && !allVkIds.includes(vkId));

        if (vkIdsToRemove.length) {
            await axios.delete(`${gateUrl}/users/vk`, { data: { vkIds: vkIdsToRemove } });
        }
    }

    private async postToWall(text: string, attachment?: string) {
        await this.axiosInstance.post('wall.post', null, {
            params: {
                owner_id: -this.groupId,
                from_group: 1,
                message: text,
                attachments: attachment
            },
        });
    }
}
