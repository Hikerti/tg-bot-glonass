import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@integrations";
import {PostDTO, UserDTO} from "@domains";
import {PaginationType} from "@shared";

@Injectable()
export class PostRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(postData: PostDTO.Create): Promise<PostDTO> {
        const post = await this.prisma.post.create({
            data: {
                type: postData.type,
                text: postData.text,
                interval: postData.interval,
                dates: postData.dates,
                media: postData.media,
                active: postData.active,
            },
        });

        await this.getPost(post.id)

        return PostDTO.fromModel(post);
    }

    async findById(id: string): Promise<PostDTO | null> {
        const post = await this.getPost(id)
        return post;
    }

    async update(id: string, postData: PostDTO.Update): Promise<PostDTO> {
        const post = await this.prisma.post.update({
            where: { id },
            data: {
                type: postData.type,
                text: postData.text,
                interval: postData.interval,
                dates: postData.dates,
                media: postData.media,
                active: postData.active,
            },
        });
        return PostDTO.fromModel(post);
    }

    async delete(id: string): Promise<PostDTO> {
        const post = await this.prisma.post.delete({
            where: { id },
        });
        return PostDTO.fromModel(post);
    }

    async getList(page: number = 1, limit: number = 10): Promise<PaginationType<PostDTO>> {
        const skip = (page - 1) * limit;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.post.findMany({
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.post.count(),
        ]);

        const isLast = (page * limit) >= total;

        return {
            items: items.map(PostDTO.fromModel),
            total,
            page,
            isLast,
            limit,
        };
    }

    async getPost(id: string): Promise<PostDTO | null> {
        const post = await this.prisma.post.findUnique({
            where: { id },
        });
        if (!post) throw new NotFoundException({ error: 'Post not found' });
        return PostDTO.fromModel(post);
    }
}
