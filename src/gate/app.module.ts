import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import {ConfigModule} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";
import {EmailModule} from "@systems";
import {TypeormModule} from "@integrations";

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

      TypeormModule,

      // system
      EmailModule
  ],
})
export class AppModule {}
