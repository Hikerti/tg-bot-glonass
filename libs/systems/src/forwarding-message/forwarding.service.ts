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
    postToWall?: boolean;
    postToMessage?: boolean;
}

@Injectable()
export abstract class AbstractPostScheduler implements OnModuleInit {

    protected abstract readonly queue: Queue;
    protected abstract readonly typePost: PostType;

    constructor(protected readonly config: ConfigService) {}

    async onModuleInit() {
        await this.clearQueue()
        await this.scheduleAllPosts();
    }

    protected abstract prepareJobData(post: PostDTO, users: UserDTO[]): ChannelJobData;

    async updatePost(post: PostDTO) {
        try {
            console.log(`[Scheduler] Attempting to update post ${post.id}...`);

            await this.removeScheduledPost(post.id);

            if (post.active) {
                await this.schedulePost(post);
                console.log(`[Scheduler] Post ${post.id} updated and rescheduled successfully.`);
            } else {
                console.log(`[Scheduler] Post ${post.id} updated: set to inactive (removed from schedule).`);
            }
        } catch (e) {
            console.error(`[Scheduler] Error updating post ${post.id}:`, e);
            throw e;
        }
    }

    protected async removeScheduledPost(postId: string): Promise<void> {
        try {
            const repeatableJobs = await this.queue.getRepeatableJobs();
            const jobToRemove = repeatableJobs.find(job => job.id === postId);

            if (jobToRemove?.id && jobToRemove?.every) {
                const repeatOptions: { jobId: string; every: number; } = {
                    jobId: jobToRemove.id,
                    every: jobToRemove.every,
                };

                await this.queue.removeRepeatable(jobToRemove.name, repeatOptions);
                console.log(`[Scheduler] Removed old repeatable job ${postId}.`);
            } else {
                console.log(`[Scheduler] No repeatable job found for ID ${postId}.`);
            }
        } catch (e) {
            console.error(`[Scheduler] Error removing repeatable job ${postId}:`, e);
            throw e;
        }
    }

    async scheduleAllPosts() {
        const response = await axios.get(`${this.config.get<string>('GATE_URL')}/posts`, {
            params: {
                page: 1,
                limit: 999999,
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

    protected async clearQueue(): Promise<void> {
        try {
            console.log(`[Scheduler] Cleaning up queue for type: ${this.typePost}...`);
            const repeatableJobs = await this.queue.getRepeatableJobs();

            for (const job of repeatableJobs) {
                if (!job.id) {
                    console.warn(`[Scheduler] Skipping repeatable job without ID.`);
                    continue;
                }

                if (job.every) {
                    const repeatOptions: { jobId: string; every: number; } = {
                        jobId: job.id,
                        every: job.every,
                    };
                    await this.queue.removeRepeatable(job.name, repeatOptions);

                } else if (job.cron) {
                    const repeatOptions: { jobId: string; cron: string; } = {
                        jobId: job.id,
                        cron: job.cron,
                    };
                    await this.queue.removeRepeatable(job.name, repeatOptions);

                } else {
                    console.warn(`[Scheduler] Repeatable job ${job.id} has no 'every' or 'cron' property for removal.`);
                }
            }

            await this.queue.empty();
            await this.queue.clean(0, 'completed');
            await this.queue.clean(0, 'failed');
            await this.queue.clean(0, 'active');
            await this.queue.clean(0, 'delayed');
            await this.queue.clean(0, 'wait');

            console.log(`[Scheduler] Queue for type: ${this.typePost} cleared successfully.`);

        } catch (e) {
            console.error(`[Scheduler] Error during queue cleanup for type ${this.typePost}:`, e);
        }
    }

    async schedulePost(post: PostDTO) {
        try {
            const intervalMs = parseInterval(post.interval);

            const responseUser = await axios.get(`${this.config.get<string>('GATE_URL')}/users`, {
                params: {
                    page: 1,
                    limit: 999999,
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
            console.log("ADDING REPEATABLE JOB", {
                id: post.id,
                every: intervalMs,
                queue: this.queue.name
            });
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