import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from "@integrations";
import {ConfigModule} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";
import {EmailModule} from "@systems";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      BullModule.forRoot({
          redis: {host: 'localhost', port: 6379},
      }),
      UserModule,
      AuthModule,
      PostModule,

      // intergation
      PrismaModule,
      // system
      EmailModule
  ],
})
export class AppModule {}
