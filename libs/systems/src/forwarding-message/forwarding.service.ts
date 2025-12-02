import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostDTO, UserDTO, UserRole, User, PostType } from '@domains';
import { parseInterval } from '@shared';
import { Queue } from 'bull';
import axios from 'axios';

export interface ChannelJobData {
    [key: string]: any;
    users: UserDTO[];
    text: string;
    media: string[];
    date: string;
}

@Injectable()
export abstract class AbstractPostScheduler implements OnModuleInit {

    protected abstract readonly queue: Queue;
    protected abstract readonly typePost: PostType;

    constructor(protected readonly config: ConfigService) {}

    onModuleInit() {
        this.scheduleAllPosts();
    }

    protected abstract prepareJobData(post: PostDTO, users: UserDTO[]): ChannelJobData;

    async scheduleAllPosts() {
        const response = await axios.get(`${this.config.get<string>('GATE_URL')}/posts`, {
            params: {
                page: 1,
                limit: 9999,
                type: this.typePost,
            }
        });
        const posts: PostDTO[] = response.data.items;

        for (const post of posts) {
            if (post.active) {
                this.schedulePost(post);
            }
        }
    }

    async schedulePost(post: PostDTO) {
        try {
            const intervalMs = parseInterval(post.interval);

            const responseUser = await axios.get(`${this.config.get<string>('GATE_URL')}/users`, {
                params: {
                    page: 1,
                    limit: 9999,
                    role: UserRole.CLIENT
                }
            });

            const userEntities = responseUser.data.items as User[];
            if (!userEntities || userEntities.length === 0) {
                console.warn(`No 'client' user found for post ${post.id}`);
                return;
            }

            const users: UserDTO[] = userEntities.map(UserDTO.fromModel);

            const jobData = this.prepareJobData(post, users);
            await this.queue.add(
                jobData,
                {
                    repeat: { every: intervalMs },
                    jobId: post.id,
                    removeOnComplete: true,
                    removeOnFail: true,
                }
            );
            console.log(`[Scheduler] Post ${post.id} (${this.typePost}) scheduled.`);

        } catch (e) {
            console.error(`[Scheduler] Error scheduling post ${post.id}:`, e);
        }
    }
}