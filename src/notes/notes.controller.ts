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
import { NotesService } from './notes.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateNoteDto } from './dto/create-note.dto';
import { CreateNoteDto } from './dto/create-note-body.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';

@UseGuards(JwtGuard)
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  // ==================== AI GENERATION ====================
  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generate(@Body() input: GenerateNoteDto, @Req() req: any) {
    return this.notesService.generateNote(input, getNumericUserId(req));
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.notesService.findAll(getNumericUserId(req));
  }

  @Get('public')
  async getPublic(@Req() req: any) {
    return this.notesService.findPublic(req?.user?.id);
  }

  @Get('private')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async getPrivate(@Req() req: any) {
    return this.notesService.findPrivate(getNumericUserId(req));
  }

  @Get('search')
  searchNotes(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
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
  @UseGuards(JwtGuard, RequireAuthGuard)
  async create(@Body() body: CreateNoteDto, @Req() req: any) {
    return this.notesService.create(body, getNumericUserId(req));
  }

  @Get('code/:code')
  async getByCode(@Param('code') code: string, @Req() req: any) {
    return this.notesService.findOneByCode(code, req?.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
    @Req() req: any,
  ) {
    return this.notesService.update(id, body, getNumericUserId(req));
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.findOneByAccess(id, req?.user?.id);
  }

  /**
   * Get note in locked format - ONLY for owner
   */
  @Get('locked/:id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async getLocked(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.getLockedNote(id, getNumericUserId(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, getNumericUserId(req));
  }

  @Delete('all')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async deleteAll(@Req() req: any) {
    return this.notesService.deleteAll(getNumericUserId(req));
  }
}
