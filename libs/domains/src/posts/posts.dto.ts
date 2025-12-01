import { IsArray, IsBoolean, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import {Post, PostType} from "./posts.entites";

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
    @IsString()
    date: string;

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
            date: model.date,
            media: model.media,
            active: model.active,
            createdAt: model.createdAt.toISOString()
        }
    }
}

export namespace PostDTO {
    export class Create extends OmitType(PostDTO, ['id', 'createdAt'] as const) {}
    export class Update extends PartialType(Create) {}
}
