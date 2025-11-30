import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { hostname } from 'os';
import { timestamp } from 'rxjs';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp
      ? exception.getResponse()
      : {
          message: exception.message || 'Internal server error',
          stack: exception.stack,
        };

    const bytes = Buffer.byteLength(JSON.stringify(request.body || {}));

    const errorResponse = {
      statusCode: status,
      path: request.path,
      method: request.method,
      timestamp: new Date().toISOString(),
      message,
      ip: request.ip,
      hostname: request.hostname,
      host: request.host,
      bytesOfBody: bytes,
    };

    this.logger.error(errorResponse);
    response.status(status).json(errorResponse);
  }
}

