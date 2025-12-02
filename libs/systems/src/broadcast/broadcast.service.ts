    import {Injectable, OnModuleInit} from "@nestjs/common";
    import {InjectQueue} from "@nestjs/bull";
    import type {Queue} from "bull";
    import {Post, PostDTO, PostType, User, UserDTO, UserRole} from "@domains";
    import axios from "axios";
    import {ConfigService} from "@nestjs/config";
    import {BroadcastJobData} from "./type";

    @Injectable()
    export class BroadcastService implements OnModuleInit{
        constructor(
            private readonly config: ConfigService,
            @InjectQueue('broadcast') private broadcastQueue: Queue,
        ) {}

        onModuleInit() {
            this.createBroadcastJob()
        }

        async createBroadcastJob() {
            try {
                const responsePost = await axios.get(`${this.config.get<string>('GATE_URL')}/posts`, {
                    params: {
                        page: 1,
                        limit: 9999,
                        type: PostType.TG,
                    }
                })

                const postEntities = responsePost.data.items as Post[]

                const posts: PostDTO[] = postEntities.map(PostDTO.fromModel);

                const responseUser = await axios.get(`${this.config.get<string>('GATE_URL')}/users`, {
                    params: {
                        page: 1,
                        limit: 9999,
                        role: UserRole.CLIENT
                    }})

                const userEntities = responseUser.data.items as User[]
                const users: UserDTO[] = userEntities.map(UserDTO.fromModel);
                console.log(posts, userEntities)

                for (const post of posts) {
                    for (const user of users) {
                        if (user && user.tgId) {
                            await this.broadcastQueue.add(
                                'send-message',
                                {
                                    chatId: user.tgId,
                                    text: post.text,
                                    media: post.media,
                                } as BroadcastJobData,
                                { delay: 100 }
                            );
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }

        }
    }