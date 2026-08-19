import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFile as FileUpload } from '../common/types/upload.type';
import { FlashCardsService } from './flash-cards.service';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import {
  getNumericUserId,
  getOptionalNumericUserId,
} from '../common/utils/shared.utils';
import { RequireAuth } from '../common/decorators/require-auth.decorator';
import { AuthenticatedRequest } from '../common/types/request.type';
import { CreateFlashCardDto } from './dto/create-flash-card.dto';
import { UpdateFlashCardDto } from './dto/update-flash-card.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

@UseGuards(JwtGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) {}

  @Post('generate/topic_or_reference')
  @RequireAuth()
  async generate(
    @Body() input: GenerateFlashCardsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.flashCardsService.generate(input, getNumericUserId(req));
  }

  @Post('generate/from-file')
  @RequireAuth()
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        const allowed = [
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/gif',
          'application/pdf',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              'Formato de archivo no soportado. Solo imágenes (PNG, JPG, WEBP, GIF) y PDF',
            ),
            false,
          );
        }
      },
    }),
  )
  async generateFromFile(
    @UploadedFiles() files: FileUpload[],
    @Body()
    input: {
      reference?: string;
      quantity?: number;
      acceso?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!files || files.length === 0) {
      throw new Error('Archivo requerido');
    }
    const filePayloads = files.map((f) => ({
      fileBase64: f.buffer.toString('base64'),
      mimeType: f.mimetype,
    }));
    return this.flashCardsService.generateFromFile(
      {
        files: filePayloads,
        reference: input.reference || '',
        quantity: input.quantity || 5,
        acceso: input.acceso || 'public',
      },
      getNumericUserId(req),
    );
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.findMyCardsDeck(userId);
  }

  @Get('public')
  async findPublic(@Req() req: AuthenticatedRequest) {
    const userId = getOptionalNumericUserId(req);
    return this.flashCardsService.findPublicCardsDeck(userId);
  }

  @UseGuards(RequireAuthGuard)
  @Get('private')
  async findPrivate(@Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.findMyCardsDeck(userId);
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Param('q') q: string,
    @Param('limit') limit: number,
    @Param('offset') offset: number,
  ) {
    const userId = getOptionalNumericUserId(req);
    return this.flashCardsService.searchFlashCards(q, userId, limit, offset);
  }

  @Get('klek/:id')
  async getCardKlek(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getOptionalNumericUserId(req);
    return this.flashCardsService.getCardKlekById(+id, userId);
  }

  @Get('locked/:id')
  @RequireAuth()
  async getLocked(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.getLockedCard(+id, userId);
  }

  @Get('code/:code')
  async getByCode(
    @Param('code') code: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getOptionalNumericUserId(req);
    return this.flashCardsService.getCardByCode(code, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getOptionalNumericUserId(req);
    return this.flashCardsService.getCardById(+id, userId);
  }

  @Post()
  @RequireAuth()
  async create(
    @Body() payload: CreateFlashCardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.create(payload, userId);
  }

  @Patch(':id')
  @RequireAuth()
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateFlashCardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.update(+id, payload, userId);
  }

  @Delete('all')
  @RequireAuth()
  async deleteAll(@Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.deleteAll(userId);
  }

  @Delete(':id')
  @RequireAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = getNumericUserId(req);
    return this.flashCardsService.remove(+id, userId);
  }
}
