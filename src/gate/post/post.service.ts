import { Injectable } from '@nestjs/common';
import {PostRepository} from "./post.repository";
import {PostDTO} from "@domains";

@Injectable()
export class PostService {
    constructor(private readonly postRepository: PostRepository) {}

    async findById(id: string): Promise<PostDTO | null> {
        return await this.postRepository.findById(id);
    }

    async getListUsers(page: number, limit: number): Promise<{ items: PostDTO[], total: number, page: number, limit: number }> {
        return await this.postRepository.getList(page, limit)
    }

    async create(dto: PostDTO.Create): Promise<PostDTO> {
        return await this.postRepository.create(dto);
    }

    async update(id: string, dto: PostDTO.Update): Promise<PostDTO> {
        return await this.postRepository.update(id, dto);
    }

    async delete(id: string): Promise<PostDTO> {
        return await this.postRepository.delete(id);
    }
}
