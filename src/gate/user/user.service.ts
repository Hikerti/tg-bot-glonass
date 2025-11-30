import { Injectable } from '@nestjs/common';
import {UserRepository} from "./user.repository";
import {UserDTO} from "@domains";
import {PaginationType} from "@shared";

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async getListUsers(page: number, limit: number): Promise<PaginationType<UserDTO>> {
        return await this.userRepository.getList(page, limit)
    }

    async create(dto: UserDTO.Create): Promise<UserDTO> {
        return await this.userRepository.create(dto);
    }

    async createMany(dto: UserDTO.Create[]): Promise<UserDTO[]> {
        return await this.userRepository.createMany(dto);
    }

    async update(id: string, dto: UserDTO.Update): Promise<UserDTO> {
        return await this.userRepository.update(id, dto);
    }

    async delete(id: string): Promise<UserDTO> {
        return await this.userRepository.delete(id);
    }
}
