import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = null;
    let aiResponse: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const r = response as any;

        message = r.message || message;
        errorCode = r.errorCode || errorCode;
        details = r.details || null;
        aiResponse = r.aiResponse || null;
        error = r.error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse: Record<string, any> = {
      status,
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      message,
      error,
      errorCode,
    };

    if (details) errorResponse.details = details;
    if (aiResponse) errorResponse.aiResponse = aiResponse;

    this.logger.error(
      `${status} ${req.method} ${req.url} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(status).json(errorResponse);
  }
}
