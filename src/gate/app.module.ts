import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { S3Module } from './s3/s3.module';
import { PrismaModule } from "@integrations";
import {ConfigModule} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";

@Module({

  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      BullModule.forRoot({
          redis: {host: 'localhost', port: 6379},
      }),
      BullModule.registerQueue({
          name: 'mail'
      }),
      UserModule,
      AuthModule,
      PostModule,
      S3Module,
      PrismaModule
  ],
})
export class AppModule {}
