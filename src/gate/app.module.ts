import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import {ConfigModule} from "@nestjs/config";
import {TypeormModule} from "@integrations";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      UserModule,
      AuthModule,
      PostModule,

      TypeormModule,
  ],
})
export class AppModule {}
