import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception['status'] || 500;
    const message = exception['message'] || 'Error interno';

    const error = {
      status,
      path: req.path,
      timestamp: new Date().toISOString(),
      message,
    };

    this.logger.error(JSON.stringify(error));
    res.status(status).json(error);
  }
}
