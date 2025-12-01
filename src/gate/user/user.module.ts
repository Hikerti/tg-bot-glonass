import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {UserRepository} from "./user.repository";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@domains";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
    ],
  providers: [UserService, UserRepository],
  controllers: [UserController]
})
export class UserModule {}
