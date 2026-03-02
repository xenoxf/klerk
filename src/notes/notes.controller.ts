import {
  Controller,
  Get,
  Post,
  // Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  // Query,
  ParseIntPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
//import { Request } from 'express';
import { NotesService } from './notes.service';
//import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
//import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';

@Controller('notes')
@UseGuards(JwtGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  // ==================== AI GENERATION a @====================
  @Post('generate/topic_or_reference')
  generate(@Body() input: any, @Req() req: any) {
    if (!input.topic && !input.referenceText) {
      throw new BadRequestException(
        'Debe proporcionar un "topic" o "referenceText" para generar notas.',
      );
    }
    if (!input.referenceText) {
      return this.notesService.generateFromTopic(input, req.user.id);
    }
    return this.notesService.generateFromReference(input, req.user.id);
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.notesService.findAll(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.findOne(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, req.user.id);
  }
}
