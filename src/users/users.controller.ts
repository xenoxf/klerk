import {
  Controller,
  //Get,
  //Post,
  Body,
  //Patch,
  // Param,
  // Delete,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
//import { CreateUserDto } from './dto/create-user.dto';
//import { UpdateUserDto } from './dto/update-user.dto';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@UseGuards(ApiKeyGuard)
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Put("/name")
  async putName(@Req() req: any, @Body() name: string) {
    return this.usersService.updateName(req.user.id, name);
  }
}
