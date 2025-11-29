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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage: (string | object) = exception.getResponse();
    let msg: string;
    if (typeof errorMessage == 'string') {
      msg = errorMessage;
    } else if (typeof errorMessage == 'object') {
      msg = String(errorMessage);
    }

    const bytes = Buffer.byteLength(JSON.stringify(request.body || {}));
    const errorResponse = {
      statusCode: status,
      path: request.path,
      method: request.method,
      timestamp: new Date().toISOString(),
      message: msg,
      ip: request.ip,
      hostname: request.hostname,
      host: request.host,
      bytesOfBody: bytes,
    }

    /*
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any)?.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log el error
    this.logger.error({
      statusCode: status,
      path: request?.originalUrl,
      method: request?.method,
      message,
      exception: exception instanceof Error ? exception.message : String(exception),
    });

    // Responder sin modificar estructura
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
    */

    this.logger.error(errorResponse);
    response.status(status).json(errorResponse);

  }
}
