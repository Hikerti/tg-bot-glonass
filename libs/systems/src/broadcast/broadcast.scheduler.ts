import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PostType, PostDTO, UserDTO } from '@domains';
import {AbstractPostScheduler, ChannelJobData} from "../forwarding-message";

@Injectable()
export class BroadcastScheduler extends AbstractPostScheduler {
    protected readonly typePost = PostType.TG;

    constructor(
        protected readonly config: ConfigService,
        @InjectQueue('broadcast') protected readonly queue: Queue
    ) {
        super(config);
    }

    protected prepareJobData(post: PostDTO, users: UserDTO[]): ChannelJobData {
        return {
            users,
            text: post.text,
            media: post.media,
            date: post.date,
        };
    }
}