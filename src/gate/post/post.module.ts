import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import {PostRepository} from "./post.repository";

@Module({
  providers: [PostService, PostRepository],
  controllers: [PostController]
})
export class PostModule {}
