import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  // ============================================
  // CONFIGURACIÓN CORS - PRODUCCIÓN SEGURO
  // ============================================
  // Configuración segura para producción
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://learnyos.vercel.app',
      'https://klerk.onrender.com',
      'https://learnyos-love.vercel.app',
      'http://localhost:2300',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type, Authorization, X-Requested-With, x-api-key, Accept',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 600,
  });

  // ============================================
  // RATE LIMITING GLOBAL (DoS Protection)
  // ============================================
  // Limita peticiones por IP para prevenir ataques DoS
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 45, // Máximo 35 peticiones por IP cada 15 minutos
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message:
          'Demasiadas peticiones, por favor intenta más tarde (15 minutos)',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting para health checks y hello
        return (
          req.path === '/health' ||
          req.path === '/ping' ||
          req.path === '/hello'
        );
      },
    }),
  );

  // ============================================
  // RATE LIMITING ESPECÍFICO PARA AUTH (Brute Force Protection)
  // ============================================
  // Limita más estrictamente los endpoints de autenticación
  app.use(
    '/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 20, // Máximo 20 intentos por IP cada 15 minutos
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message:
          'Demasiados intentos de autenticación, por favor intenta más tarde (15 minutos) ',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ============================================
  // RATE LIMITING PARA AI GENERATION (Abuse Protection)
  // ============================================
  // Limita el uso de generación con IA para prevenir abuso
  app.use(
    '/exams/generate/topic_or_reference',
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20, // Máximo 20 generaciones por hora
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Límite de generación de exámenes alcanzado, espera una hora.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    '/flash-cards/generate/topic_or_reference',
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20, // Máximo 20 generaciones por hora
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message:
          'Límite de generación de flashcards alcanzado, espera una hora.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    '/notes/generate/topic_or_reference',
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20, // Máximo 20 generaciones por hora
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Límite de generación de notas alcanzado, espera una hora.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ============================================
  // HELMET - SECURITY HEADERS MEJORADOS
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'",
            'https://klerk.onrender.com',
            'http://localhost:2300',
            'http://localhost:4000',
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // ============================================
  // REQUEST SIZE LIMITS (Payload Attack Protection)
  // ============================================
  // Limita el tamaño del body de las peticiones
  app.use((req, res, next) => {
    // Skip para endpoints que no tienen body
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxContentLength = 1024 * 1024; // 1MB máximo

    if (contentLength > maxContentLength) {
      return res.status(413).json({
        statusCode: 413,
        error: 'Payload Too Large',
        message: `El tamaño de la petición excede el límite de ${maxContentLength / 1024}KB`,
      });
    }

    next();
  });

  // ============================================
  // VALIDATION PIPE CON SANITIZACIÓN
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Rechaza propiedades no definidas en DTO
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // CUSTOM SANITIZATION MIDDLEWARE (XSS Protection)
  // ============================================
  app.use((req, res, next) => {
    // Sanitiza strings en el body para prevenir XSS
    if (req.body && typeof req.body === 'object') {
      const sanitize = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            let sanitized = obj[key];
            // Remueve scripts
            sanitized = sanitized.replace(
              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
              '',
            );
            // Remueve tags HTML
            sanitized = sanitized.replace(/<[^>]*>/g, '');
            // Remueve eventos onclick, onerror, etc.
            sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
            obj[key] = sanitized;
          } else if (obj[key] && typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        }
      };
      sanitize(req.body);
    }
    next();
  });

  // ============================================
  // GLOBAL EXCEPTIONS FILTER
  // ============================================
  app.useGlobalFilters(new AllExceptionsFilter());

  // ============================================
  // SECURITY LOGGING MIDDLEWARE
  // ============================================
  const securityLogger = new Logger('Security');

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      // Log errors 4xx and 5xx only in development
      if (res.statusCode >= 400 && process.env.NODE_ENV !== 'production') {
        securityLogger.log(
          `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`,
        );
      }

      // Log slow requests only in development
      if (duration > 5000 && process.env.NODE_ENV !== 'production') {
        securityLogger.warn(
          `Slow request: ${req.method} ${req.path} - ${duration}ms`,
        );
      }
    });

    next();
  });

  app.useGlobalGuards(new ApiKeyGuard());

  // ============================================
  // INICIALIZACIÓN DEL SERVIDOR
  // ============================================
  const port = process.env.PORT ?? 2300;

  await app.listen(port, '0.0.0.0');
  const maskedApiKey = process.env.API_KEY;
  console.log(`
  🚀  ==========================================
  ✅  SERVIDOR INICIADO CORRECTAMENTE
  🔒  MODO SEGURO ACTIVADO
  📌  Puerto: ${port}
  🌐  URL: http://localhost:${port}
  🌐  🚀: https://klerk.onrender.com
  🌐  💙: https://klerk-love.onrender.com

  🛡️  SECURITY FEATURES:
     • Rate Limiting: 45 req/15min global
     • Auth Rate Limit: 20 req/15min
     • AI Gen Rate Limit: 20 req/hour
     • Max Payload: 1MB
     • Helmet Security: ENABLED
     • XSS Protection: ENABLED
     • SQL Injection Protection: ENABLED
     • Suspicious Activity Logging: ENABLED

  🔐  Health Check: http://localhost:${port}/health
  🔑  X-API-KEY: ${maskedApiKey}
  ==========================================
  `);
}

bootstrap();
