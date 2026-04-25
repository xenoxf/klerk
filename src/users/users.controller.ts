import {
  Controller,
  Body,
  UseGuards,
  Put,
  Req,
  Get,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from '../common/types/request.type';

@UseGuards(ApiKeyGuard)
@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    // Only allow authenticated users to see their own data
    const userId = getNumericUserId(req);
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put('/name')
  async putName(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string },
  ) {
    return this.usersService.updateName(getNumericUserId(req), body.name);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
