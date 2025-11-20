import { IsArray, IsBoolean, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Post, PostType } from "@prisma/client";

export class PostDTO {
    @IsString()
    id: string;

    @IsString()
    type: PostType;

    @IsString()
    text: string;

    @IsString()
    interval: string;

    @IsArray()
    @IsString({ each: true })
    dates: string[];

    @IsArray()
    @IsString({ each: true })
    media: string[];

    @IsBoolean()
    active: boolean;

    @IsString()
    createdAt: string;

    static fromModel(model: Post): PostDTO {
        return {
            id: model.id,
            type: model.type,
            text: model.text,
            interval: model.interval,
            dates: model.dates,
            media: model.media,
            active: model.active,
            createdAt: model.created_at.toISOString()
        }
    }
}

export namespace PostDTO {
    export class Create extends OmitType(PostDTO, ['id', 'createdAt'] as const) {}
    export class Update extends PartialType(Create) {}
}
