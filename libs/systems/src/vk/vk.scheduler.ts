import {Injectable} from "@nestjs/common";
import {AbstractPostScheduler, ChannelJobData} from "../forwarding-message";
import {PostDTO, PostType, UserDTO} from "@domains";
import {ConfigService} from "@nestjs/config";
import {InjectQueue} from "@nestjs/bull";
import {VkService} from "./vk.service";
import type {Queue} from "bull";

@Injectable()
export class VkScheduler extends AbstractPostScheduler {
    protected readonly typePost = PostType.VK;

    constructor(
        protected readonly config: ConfigService,
        @InjectQueue('vk') protected readonly queue: Queue,
        private readonly vkService: VkService
    ) {
        super(config);
    }

    async syncUsers() {
        await this.vkService.syncSubscribers();
    }

    protected prepareJobData(post: PostDTO, users: UserDTO[]): ChannelJobData {
        const filteredUsers = users.filter(u => u.vkId);
        return {
            users: filteredUsers,
            text: post.text,
            media: post.media,
            date: post.date,
            postToWall: post.postToWall,
            postToMessage: post.postToMessage,
        };
    }

    async schedulePostWithSync(post: PostDTO) {
        await this.syncUsers();
        await this.schedulePost(post);
    }
}
