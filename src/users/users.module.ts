import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { SharedModule } from '../shared/shared.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SharedModule, JwtModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, SharedModule],
})
export class UsersModule { }
