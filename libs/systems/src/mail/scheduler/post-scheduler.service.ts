import {Injectable, OnModuleInit} from "@nestjs/common";
import {InjectQueue} from "@nestjs/bull";
import {PostDTO} from "@domains";
import {parseInterval} from "../../../../shared/src/utils/parseInterval";
import {Queue} from "bull";

@Injectable()
export class PostScheduler implements OnModuleInit {
    constructor(@InjectQueue('mail') private mailQueue: Queue) {}

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
        const intervalMs = parseInterval(post.interval)

        this.mailQueue.add(
            {
                users: [],
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
    }
}