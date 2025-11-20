import { Injectable } from '@nestjs/common';
import {UserRepository} from "./user.repository";
import {UserDTO} from "@domains";

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async getListUsers(page: number, limit: number): Promise<{ items: UserDTO[], total: number, page: number, limit: number }> {
        return await this.userRepository.getList(page, limit)
    }

    async create(dto: UserDTO.Create): Promise<UserDTO> {
        return await this.userRepository.create(dto);
    }

    async update(id: string, dto: UserDTO.Update): Promise<UserDTO> {
        return await this.userRepository.update(id, dto);
    }

    async delete(id: string): Promise<UserDTO> {
        return await this.userRepository.delete(id);
    }
}
