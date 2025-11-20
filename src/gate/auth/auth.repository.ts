import {PrismaService} from "@integrations";
import {UserDTO} from "@domains";
import {NotFoundException} from "@nestjs/common";

export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findUserById(id: string): Promise<UserDTO> {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
            }
        })

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`)
        }

        return UserDTO.fromModel(user)
    }

    async findUserByTgId(tgId: string): Promise<UserDTO> {
        const user = await this.prisma.user.findFirst({
            where: {
                tg_id: tgId
            }
        })

        if (!user) {
            throw new NotFoundException(`User with tgId ${tgId} not found`)
        }

        return UserDTO.fromModel(user)
    }
}