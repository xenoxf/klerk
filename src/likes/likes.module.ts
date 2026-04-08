import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { CardLike } from './entities/card-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CardLike])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
