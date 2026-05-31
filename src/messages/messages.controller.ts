import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MessagesService } from './messages.service';
import { FileStorageService } from '../common/file-storage.service';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE, validateMagicBytes, validateWebpMagicBytes } from '../common/file.constants';
import { SendMessageWithFileDto } from './dto/send-message-with-file.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { AuthenticatedRequest } from '../common/types/request.type';
import { UploadedFile as FileUpload } from '../common/types/upload.type';

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Post('send')
  sendWithAIResponse(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.sendMessageWithAIResponse(
      input,
      getNumericUserId(req),
    );
  }

  @Post('send/stream/with-file')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req: any, file: any, cb: (error: Error | null, accept: boolean) => void) => {
      if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Formato de archivo no soportado. Solo imágenes (PNG, JPG, WEBP, GIF) y PDF'), false);
      }
      cb(null, true);
    },
  }))
  async sendStreamWithFile(
    @UploadedFiles() files: FileUpload[],
    @Body() input: SendMessageWithFileDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Archivo(s) requerido(s)' });
    }

    for (const f of files) {
      const magicValid = f.mimetype === 'image/webp'
        ? validateWebpMagicBytes(f.buffer)
        : validateMagicBytes(f.buffer, f.mimetype);
      if (!magicValid) {
        return res.status(400).json({
          message: `El archivo "${f.originalname}" no coincide con su tipo declarado (${f.mimetype})`,
        });
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const savedFiles = await Promise.all(files.map(async (f) => {
      const fileBase64 = f.buffer.toString('base64');
      const filePath = await this.fileStorage.saveFile(f.buffer, f.originalname);
      return {
        fileBase64,
        mimeType: f.mimetype,
        fileName: f.originalname,
        filePath,
      };
    }));

    try {
      const stream = await this.messagesService.sendMessageStreamWithFile(
        {
          prompt: input.prompt || '',
          chatId: input.chatId,
          files: savedFiles,
        },
        getNumericUserId(req),
      );

      for await (const chunk of stream) {
        res.write(chunk);
      }
    } catch (error: unknown) {
      for (const f of savedFiles) {
        await this.fileStorage.deleteFile(f.filePath).catch(() => {});
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error en el stream';
      if (!res.headersSent) {
        res.status(500).json({ message: errorMessage });
      } else {
        res.write(
          JSON.stringify({
            type: 'error',
            content: errorMessage,
          }),
        );
      }
    }

    res.end();
  }

  @Post('send/stream')
  async sendStream(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await this.messagesService.sendMessageStream(
      input,
      getNumericUserId(req),
    );

    try {
      for await (const chunk of stream) {
        res.write(chunk);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error en el stream';
      if (!res.headersSent) {
        res.status(500).json({ message: errorMessage });
      } else {
        res.write(
          JSON.stringify({
            type: 'error',
            content: errorMessage,
          }),
        );
      }
    }

    res.end();
  }

  @Post('chats')
  createChat(
    @Body() input: { title?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.createChat(getNumericUserId(req), input.title);
  }

  @Get('chats')
  getUserChats(@Req() req: AuthenticatedRequest) {
    return this.messagesService.getUserChats(getNumericUserId(req));
  }

  @Get('chat/:chatId')
  getChatMessages(
    @Param('chatId') chatId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.getChatMessages(+chatId, getNumericUserId(req));
  }

  @Delete('chat/all')
  deleteAllChats(@Req() req: AuthenticatedRequest) {
    return this.messagesService.deleteAllChats(getNumericUserId(req));
  }

  @Delete('chat/:chatId')
  deleteChat(
    @Param('chatId') chatId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.deleteChat(+chatId, getNumericUserId(req));
  }
}
