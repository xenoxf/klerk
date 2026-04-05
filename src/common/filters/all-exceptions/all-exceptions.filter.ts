import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
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
    let details = null;
    let errorCode = 'INTERNAL_ERROR';
    let aiResponse = null;

    // Manejar excepciones HTTP de NestJS
    if (exception instanceof BadRequestException) {
      status = 400;
      error = 'Bad Request';
      const response = exception.getResponse() as any;

      if (typeof response === 'object' && response.message) {
        message = response.message;
        details = response.details || null;
        errorCode = response.errorCode || 'BAD_REQUEST';
        aiResponse = response.aiResponse || null;
      } else if (typeof response === 'string') {
        message = response;
      } else if (Array.isArray(response?.message)) {
        message = response.message[0];
      }
    } else if (exception instanceof NotFoundException) {
      status = 404;
      error = 'Not Found';
      const response = exception.getResponse() as any;
      message = typeof response === 'object' ? response.message : response;
    } else if (exception instanceof UnauthorizedException) {
      status = 401;
      error = 'Unauthorized';
      const response = exception.getResponse() as any;
      message = typeof response === 'object' ? response.message : response;
    } else if (exception instanceof ForbiddenException) {
      status = 403;
      error = 'Forbidden';
      const response = exception.getResponse() as any;
      message = typeof response === 'object' ? response.message : response;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse: any = {
      status,
      path: req.path,
      timestamp: new Date().toISOString(),
      message,
      error,
    };

    if (details) {
      errorResponse.details = details;
    }

    if (errorCode) {
      errorResponse.errorCode = errorCode;
    }

    if (aiResponse) {
      errorResponse.aiResponse = aiResponse;
    }

    this.logger.error(`${status} - ${req.method} ${req.path} - ${message}`);
    res.status(status).json(errorResponse);
  }
}
