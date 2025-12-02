import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PostType, PostDTO, UserDTO } from '@domains';
import {AbstractPostScheduler, ChannelJobData} from "../forwarding-message";

@Injectable()
export class MailScheduler extends AbstractPostScheduler {
    protected readonly typePost = PostType.MAIL;

    constructor(
        protected readonly config: ConfigService,
        @InjectQueue('mail') protected readonly queue: Queue
    ) {
        super(config);
    }

    protected prepareJobData(post: PostDTO, users: UserDTO[]): ChannelJobData {
        return {
            users,
            text: post.text,
            media: post.media,
            date: post.date,
            subject: 'Новое сообщение',
        };
    }
}