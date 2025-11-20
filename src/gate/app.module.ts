import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { S3Module } from './s3/s3.module';
import {PrismaModule} from "@integrations";

@Module({
  imports: [UserModule, AuthModule, PostModule, S3Module, PrismaModule],
})
export class AppModule {}
