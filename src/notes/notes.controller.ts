import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.notesService.generateNotes(createNoteDto, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.notesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.notesService.findOne(+id, userId);
  }


  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.notesService.remove(+id, userId);
  }

}
