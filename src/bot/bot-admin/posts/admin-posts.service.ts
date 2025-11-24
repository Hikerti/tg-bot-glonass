import {Command, Update} from "nestjs-telegraf";
import {ConfigService} from "@nestjs/config";

@Update()
export class AdminPostsService {
    constructor(private config: ConfigService) {}

    @Command('get_posts_list')
    async getPostsList() {}

    @Command('create_letter')
    async createLetter() {}

    @Command('get_posts_tg')
    async getPostListTg() {}

    @Command('create_tg_post')
    async createPostTg() {}
}