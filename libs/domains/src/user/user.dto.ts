import { IsEmail, IsOptional, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import {User, UserRole} from "./user.entites";

export class UserDTO {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsEmail()
    @IsOptional()
    email?: string | null;

    @IsString()
    @IsOptional()
    tgId?: string | null;

    @IsString()
    role: UserRole;

    @IsString()
    createdAt: string;

    @IsString()
    updatedAt: string;

    static fromModel(model: User): UserDTO {
        return {
            id: model.id,
            name: model.name,
            email: model.email,
            tgId: model.tgId ?? null,
            role: model.role,
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
        }
    }
}

export namespace UserDTO {
    export class Create extends OmitType(UserDTO, ['id', 'createdAt', 'updatedAt'] as const) {}
    export class Update extends PartialType(Create) {}
}
