import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import {UserDTO, UserRole, User} from "@domains";
import { PaginationType } from "@shared";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(userData: UserDTO.Create): Promise<UserDTO> {
        const userEntity = this.userRepository.create({
            name: userData.name,
            email: userData.email ?? null,
            tgId: userData.tgId ?? null,
            role: userData.role as UserRole,
        });

        const user = await this.userRepository.save(userEntity);

        return UserDTO.fromModel(user);
    }

    async createMany(users: UserDTO.Create[]): Promise<UserDTO[]> {
        const userEntities = users.map(u => this.userRepository.create({
            name: u.name,
            email: u.email ?? null,
            tgId: u.tgId ?? null,
            role: u.role as UserRole,
        }));

        await this.userRepository.save(userEntities);

        const emails: string[] = users
            .map(u => u.email)
            .filter((email): email is string => !!email);

        const createdUsers = await this.userRepository.find({
            where: { email: { $in: emails } as any }, // TypeORM синтаксис для IN-запроса
        });

        return createdUsers.map(UserDTO.fromModel);
    }

    async update(id: string, userData: UserDTO.Update): Promise<UserDTO> {
        const existingUser = await this.userRepository.findOneBy({ id });
        if (!existingUser) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        this.userRepository.merge(existingUser, {
            name: userData.name,
            email: userData.email,
            tgId: userData.tgId,
            role: userData.role as UserRole,
        });

        const user = await this.userRepository.save(existingUser);

        return UserDTO.fromModel(user);
    }

    async delete(id: string): Promise<UserDTO> {
        const userToDelete = await this.userRepository.findOneBy({ id });

        if (!userToDelete) {
            throw new NotFoundException({ error: 'User not found' });
        }

        await this.userRepository.delete(id);

        return UserDTO.fromModel(userToDelete);
    }

    async getList(page: number = 1, limit: number = 10): Promise<PaginationType<UserDTO>> {
        const skip = (page - 1) * limit;

        const [items, total] = await this.userRepository.findAndCount({
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        const isLast = (page * limit) >= total;

        return {
            items: items.map(UserDTO.fromModel),
            total,
            page,
            isLast,
            limit,
        };
    }

    async getUser(id: string): Promise<UserDTO> {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException({ error: 'User not found' });
        }

        return UserDTO.fromModel(user);
    }
}