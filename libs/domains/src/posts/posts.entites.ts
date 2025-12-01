import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PostType {
    TG = 'tg',
    MAIL = 'mail',
}

@Entity({ name: 'posts' })
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PostType,
    })
    type: PostType;

    @Column()
    text: string;

    @Column()
    interval: string;

    @Column()
    date: string;

    @Column('text', { array: true, default: [] })
    media: string[];

    @Column({ default: false })
    active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}