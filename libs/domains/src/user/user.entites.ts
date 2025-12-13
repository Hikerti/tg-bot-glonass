import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    CLIENT = 'client',
}

@Entity({ name: 'user' })
@Unique(['tgId'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        nullable: true,
        type: 'varchar'
    })
    email: string | null;

    @Column({ name: 'tg_id', nullable: true, type: 'varchar' })
    tgId: string | null;

    @Column({ name: 'vk_id', nullable: true, type: 'varchar' })
    vkId: number | null;

    @Column({
        type: 'enum',
        enum: UserRole,
    })
    role: UserRole;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}