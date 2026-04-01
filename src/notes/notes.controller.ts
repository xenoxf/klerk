import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
//import { Request } from 'express';
import { NotesService } from './notes.service';
//import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateNoteDto } from './dto/create-note.dto';
//import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  // ==================== AI GENERATION a @====================
  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard)
  generate(@Body() input: GenerateNoteDto, @Req() req: any) {
    return this.notesService.generateNote(input, req.user.id);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getAll(@Req() req: any) {
    return this.notesService.findAll(req.user.id);
  }

  @Get('public')
  async getPublic(@Req() req: any) {
    return this.notesService.findPublic(req?.user?.id);
  }

  @Get('private')
  @UseGuards(JwtGuard)
  async getPrivate(@Req() req: any) {
    return this.notesService.findPrivate(req.user.id);
  }

  @Get('search')
  searchNotes(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 30,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('searchInContent') searchInContent: string = 'true',
    @Req() req: any,
  ) {
    return this.notesService.searchNotes(
      query,
      req?.user?.id,
      limit,
      offset,
      searchInContent === 'true',
    );
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() body: any, @Req() req: any) {
    return this.notesService.create(body, req.user.id);
  }

  @Get('code/:code')
  async getByCode(@Param('code') code: string, @Req() req: any) {
    return this.notesService.findOneByCode(code, req?.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.notesService.update(id, body, req.user.id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.findOneByAccess(id, req?.user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, req.user.id);
  }
}
