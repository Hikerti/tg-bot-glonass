import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PostType {
  TG = 'tg',
  MAIL = 'mail',
  MAIL2 = 'mail2',
  MAIL3 = 'mail3',
  MAIL4 = 'mail4',
  MAIL5 = 'mail5',
  MAIL6 = 'mail6',
  VK = 'vk',
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

    @Column({name: 'post_to_wall', default: false })
    postToWall: boolean

    @Column({name: 'post_to_message', default: false })
    postToMessage: boolean

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}