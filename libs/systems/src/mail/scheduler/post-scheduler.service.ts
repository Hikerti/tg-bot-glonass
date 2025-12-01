import {Injectable, OnModuleInit} from "@nestjs/common";
import {InjectQueue} from "@nestjs/bull";
import {PostDTO, UserDTO, UserRole, User, PostType} from "@domains";
import {PaginationType, parseInterval} from "@shared";
import type {Queue} from "bull";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import axios from "axios";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class PostScheduler implements OnModuleInit {
    constructor(
        private readonly config: ConfigService,

        @InjectQueue('mail') private mailQueue: Queue,
        @InjectRepository(User) private readonly database: Repository<User>
    ) {}

    onModuleInit() {
        this.scheduleAllPosts();
    }



    async scheduleAllPosts() {
        const response = await axios.get(`${this.config.get<string>('GATE_URL')}/posts`, {
            params: {
                page: 1,
                limit: 9999,
                type: PostType.MAIL,
            }
        })
        const posts = response.data.items

        for (const post of posts) {
            if (post.active && post.type === 'mail') {
                this.schedulePost(post);
            }
            console.log(post);
        }
    }

    async schedulePost(post: PostDTO) {
        try {
            const intervalMs = parseInterval(post.interval)
            const userEntities = await this.database.find({ where: { role: UserRole.CLIENT } })

            if (!userEntities) {
                console.warn(`No 'client' user found for post ${post.id}`);
                return;
            }

            const users: UserDTO[] = userEntities.map(UserDTO.fromModel);

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