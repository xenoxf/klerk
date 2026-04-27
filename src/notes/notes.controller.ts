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
import { CreateNoteDto } from './dto/create-note-body.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  getNumericUserId,
  getOptionalNumericUserId,
} from '../common/utils/shared.utils';
import { RequireAuth } from '../common/decorators/require-auth.decorator';
import { AuthenticatedRequest } from '../common/types/request.type';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('generate/topic_or_reference')
  @RequireAuth()
  async generate(
    @Body() input: GenerateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.generate(input, getNumericUserId(req));
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.notesService.findAll(getOptionalNumericUserId(req));
  }

  @Get('public')
  async findPublic(@Req() req: AuthenticatedRequest) {
    return this.notesService.findPublic(getOptionalNumericUserId(req));
  }

  @Get('private')
  @RequireAuth()
  async findPrivate(@Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.notesService.findPrivate(userId);
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Param('q') q: string,
    @Param('limit') limit: number,
    @Param('offset') offset: number,
    @Param('searchInContent') searchInContent: boolean,
  ) {
    return this.notesService.searchNotes(
      q,
      getOptionalNumericUserId(req),
      limit,
      offset,
      searchInContent,
    );
  }

  @Post()
  @RequireAuth()
  async create(
    @Body() payload: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getNumericUserId(req);
    return this.notesService.create(payload, userId);
  }

  @Get('code/:code')
  async getByCode(
    @Param('code') code: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.findOneByCode(code, getOptionalNumericUserId(req));
  }

  @Get('locked/:id')
  @RequireAuth()
  async getLocked(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.notesService.getLockedNote(+id, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notesService.findOneByAccess(+id, getOptionalNumericUserId(req));
  }

  @Patch(':id')
  @RequireAuth()
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getNumericUserId(req);
    return this.notesService.update(+id, payload, userId);
  }

  @Delete('all')
  @RequireAuth()
  async deleteAll(@Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.notesService.deleteAll(userId);
  }

  @Delete(':id')
  @RequireAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.notesService.remove(+id, userId);
  }
}
