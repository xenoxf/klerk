import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { GenerateNoteDto } from './dto/create-note.dto';
import { getNumericUserId } from '../common/utils/shared.utils';
import { RequireAuth } from '../common/decorators/require-auth.decorator';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('generate/topic_or_reference')
  @RequireAuth()
  async generate(@Body() input: GenerateNoteDto, @Req() req: any) {
    return this.notesService.generate(input, getNumericUserId(req));
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.findAll(userId);
  }

  @Get('public')
  async findPublic(@Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.findPublic(userId);
  }

  @Get('private')
  @RequireAuth()
  async findPrivate(@Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.findPrivate(userId);
  }

  @Get('search')
  async search(
    @Req() req: any,
    @Param('q') q: string,
    @Param('limit') limit: number,
    @Param('offset') offset: number,
    @Param('searchInContent') searchInContent: boolean,
  ) {
    const userId = getNumericUserId(req);
    return this.notesService.searchNotes(
      q,
      userId,
      limit,
      offset,
      searchInContent,
    );
  }

  @Post()
  @RequireAuth()
  async create(@Body() payload: any, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.create(payload, userId);
  }

  @Get('code/:code')
  async getByCode(@Param('code') code: string, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.findOneByCode(code, userId);
  }

  @Get('locked/:id')
  @RequireAuth()
  async getLocked(@Param('id') id: string, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.getLockedNote(+id, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.findOneByAccess(+id, userId);
  }

  @Patch(':id')
  @RequireAuth()
  async update(
    @Param('id') id: string,
    @Body() payload: any,
    @Req() req: any,
  ) {
    const userId = getNumericUserId(req);
    return this.notesService.update(+id, payload, userId);
  }

  @Delete('all')
  @RequireAuth()
  async deleteAll(@Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.deleteAll(userId);
  }

  @Delete(':id')
  @RequireAuth()
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.notesService.remove(+id, userId);
  }
}
