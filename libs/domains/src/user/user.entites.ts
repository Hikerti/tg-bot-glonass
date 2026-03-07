import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    CLIENT = 'client',
}

export enum UserTypeEmail {
  MAIL = 'mail',
  MAIL2 = 'mail2',
  MAIL3 = 'mail3',
  MAIL4 = 'mail4',
  MAIL5 = 'mail5',
  MAIL6 = 'mail6',
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
    type: 'varchar',
    unique: true,
  })
  email: string | null;

  @Column({ name: 'tg_id', nullable: true, type: 'varchar' })
  tgId: string | null;

  @Column({ name: 'vk_id', nullable: true, type: 'varchar' })
  vkId: number | null;

  @Column({
    type: 'enum',
    name: 'type_email',
    enum: UserTypeEmail,
  })
  typeEmail: UserTypeEmail;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: 'mail',
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}