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
import { Request } from 'express';
import { NotesService } from './notes.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';

@Controller('notes')
@UseGuards(JwtGuard)
@UseGuards(ApiKeyGuard)
export class NotesController {
  constructor(private notesService: NotesService) { }

  @Post()
  async create(
    @Body() input: { title: string; content: string; color?: string; tags?: string[] },
    @Req() req: any
  ) {
    return this.notesService.create(input, req.user.id);
  }

  @Get()
  async getAll(
    @Query()
    filters: {
      search?: string;
      tags?: string;
      color?: string;
      sort?: 'newest' | 'oldest' | 'updated';
      page?: number;
      limit?: number;
    },
    @Req() req: any
  ) {
    return this.notesService.getAll(filters, req.user.id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.getById(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: { title?: string; content?: string; color?: string; tags?: string[] },
    @Req() req: any
  ) {
    return this.notesService.update(id, input, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.delete(id, req.user.id);
  }

  @Get('search/advanced')
  async search(
    @Req() req: any,
    @Query('q') query: string,
    @Query('tags') tags?: string,
    @Query('color') color?: string,
  ) {
    return this.notesService.search({ query, tags, color }, req.user.id);
  }

  @Post('generate/topic')
  generateFromTopic(@Body() input: { topic: string }, @Req() req) {
    return this.notesService.generateNoteFromTopic(input, req.user.id);
  }

  @Post('generate/reference')
  generateFromReference(@Body() input: { referenceText: string }, @Req() req) {
    return this.notesService.generateNoteFromReference(input, req.user.id);
  }
}
