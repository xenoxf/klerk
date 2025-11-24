import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly showStack: boolean;

  /**
   * @param showStack Si true incluirá stack trace en la respuesta (usar false en producción).
   */
  constructor(showStack = process.env.NODE_ENV !== 'production') {
    this.showStack = showStack;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default values
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Build base payload
    const payload: any = {
      timestamp: new Date().toISOString(),
      path: request?.originalUrl ?? request?.url ?? null,
      method: request?.method ?? null,
      statusCode: status,
    };

    // If it's an HttpException, try to extract structured response
    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      /*
        getResponse() can return:
        - string
        - { message: ..., error: ... }
        - Validation error object from class-validator (object with message array)
      */

      if (typeof res === 'string') {
        payload.message = res;
      } else if (typeof res === 'object' && res !== null) {
        // Common Nest shape: { statusCode, message, error }
        const { message, error, ...rest } = res as any;
        // message can be array (validation) or string
        payload.message = Array.isArray(message)
          ? 'Validation failed'
          : (message ?? error ?? 'Error');
        // attach other fields under details
        payload.details = rest;
        // if it's validation errors (message is array)
        if (Array.isArray(message)) {
          payload.validationErrors = message;
        }
      } else {
        payload.message = 'Http exception';
      }
    } else {
      // Non-http exception (unknown)
      payload.message = (exception as any)?.message ?? 'Internal server error';
      // attempt to attach any custom fields
      if (typeof exception === 'object' && exception !== null) {
        // copy useful keys except stack
        const { stack, message, ...rest } = exception as any;
        if (Object.keys(rest).length) payload.details = rest;
      }
    }

    // Include stacktrace only if allowed
    if (this.showStack) {
      payload.stack = (exception as any)?.stack ?? null;
    }

    // Logging: error-level with full exception
    this.logger.error({
      message: payload.message,
      status: payload.statusCode,
      path: payload.path,
      method: payload.method,
      details: payload.details ?? null,
      exception: this.showStack
        ? (exception as any)
        : ((exception as any)?.message ?? exception),
    });

    // Safe default: if status is not set, make it 500
    if (!status || status < 400 || status > 599) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      payload.statusCode = status;
    }

    response.status(status).json(payload);
  }
}
