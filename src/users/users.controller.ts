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
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
//import { CreateUserDto } from './dto/create-user.dto';
//import { UpdateUserDto } from './dto/update-user.dto';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { JwtGuard } from '../auth/jwt/jwt.guard';

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

@UseGuards(ApiKeyGuard)
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('/name')
  async putName(@Req() req: any, @Body() name: string) {
    return this.usersService.updateName(getNumericUserId(req), name);
  }
}
