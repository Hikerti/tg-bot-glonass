import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@integrations";
import { UserDTO } from "@domains";

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(userData: UserDTO.Create): Promise<UserDTO> {
        const user = await this.prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email ?? null,
                tg_id: userData.tgId ?? null,
                role: userData.role,
            },
        });

        await this.getUser(user.id)

        return UserDTO.fromModel(user);
    }

    async update(id: string, userData: UserDTO.Update): Promise<UserDTO> {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                name: userData.name,
                email: userData.email,
                tg_id: userData.tgId,
                role: userData.role,
            },
        });

        await this.getUser(user.id)

        return UserDTO.fromModel(user);
    }

    async delete(id: string): Promise<UserDTO> {
        const user = await this.prisma.user.delete({
            where: { id },
        });

        return UserDTO.fromModel(user);
    }

    async getList(page: number = 1, limit: number = 10): Promise<{ items: UserDTO[], total: number, page: number, limit: number }> {
        const skip = (page - 1) * limit;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.user.count(),
        ]);

        return {
            items: items.map(UserDTO.fromModel),
            total,
            page,
            limit,
        };
    }

    async getUser(id: string): Promise<UserDTO | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) throw new NotFoundException({ error: 'User not found' });
        return UserDTO.fromModel(user);
    }
}
