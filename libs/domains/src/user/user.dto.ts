import { IsEmail, IsOptional, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import {User, UserRole} from '@generated/client';

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
            tgId: model.tg_id ?? null,
            role: model.role,
            createdAt: model.created_at.toISOString(),
            updatedAt: model.updated_at.toISOString(),
        }
    }
}

export namespace UserDTO {
    export class Create extends OmitType(UserDTO, ['id', 'createdAt', 'updatedAt'] as const) {}
    export class Update extends PartialType(Create) {}
}
