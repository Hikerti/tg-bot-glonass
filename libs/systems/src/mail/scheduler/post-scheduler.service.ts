import {Injectable, OnModuleInit} from "@nestjs/common";
import {InjectQueue} from "@nestjs/bull";
import {PostDTO} from "@domains";
import {parseInterval} from "@shared";
import type {Queue} from "bull";
import {PrismaService} from "@integrations";

@Injectable()
export class PostScheduler implements OnModuleInit {
    constructor(@InjectQueue('mail') private mailQueue: Queue, private readonly prisma: PrismaService) {}

    onModuleInit() {
        this.scheduleAllPosts();
    }

    async scheduleAllPosts() {
        const posts: PostDTO[] = []

        for (const post of posts) {
            if (post.active && post.type === 'mail') {
                this.schedulePost(post);
            }
        }
    }

    async schedulePost(post: PostDTO) {
        try {
            const intervalMs = parseInterval(post.interval)
            const users = this.prisma.user.findMany({where: {role: 'client'}})

            this.mailQueue.add(
                {
                    users,
                    text: post.text,
                    media: post.media,
                    date: post.date
                },
                {
                    repeat: {
                        every: intervalMs
                    },
                    jobId: post.id,
                    removeOnComplete: true,
                    removeOnFail: true,
                }
            )
        } catch (e) {
            console.error(e)
        }
    }
}