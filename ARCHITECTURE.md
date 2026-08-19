# Arquitectura de Klerk API

Especificación técnica de la construcción del proyecto.

## 1. Visión general

Klerk API es un backend monolítico modular construido con NestJS 10. Expone una REST API para una plataforma educativa donde los usuarios generan material de estudio (exámenes, flashcards, notas) mediante IA, chatean con un asistente educativo y comparten contenido con la comunidad.

```
┌─────────────┐     HTTPS      ┌──────────────────────────────────────┐
│  Frontend   │ ─────────────> │           Klerk API (NestJS)          │
│  (React/Vue)│                │  Auth │ Users │ Exams │ FlashCards    │
└─────────────┘                │  Notes │ Messages │ Credits │ Likes   │
                               │  GlobalChat │ ExamAttempts │ Gemini   │
                               └──────┬───────────────┬───────────────┘
                                      │               │
                              ┌───────▼──────┐  ┌─────▼──────────────┐
                              │  PostgreSQL  │  │  Google Gemini API │
                              │  (TypeORM)   │  │  + SMTP + Google   │
                              └──────────────┘  │  OAuth             │
                                               └────────────────────┘
```

## 2. Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Controladores | `src/*/*.controller.ts` | HTTP, DTOs, guards, serialización de respuestas |
| Servicios | `src/*/*.service.ts` | Lógica de negocio, orquestación |
| Entidades | `src/*/entities/*.entity.ts` | Modelo de datos (TypeORM) |
| DTOs | `src/*/dto/*.dto.ts` | Validación con `class-validator` |
| Módulos comunes | `src/common/` | Guards, filtros, decoradores, utilidades, almacenamiento de archivos |
| Configuración | `src/app.module.ts`, `src/main.ts` | Bootstrap, middleware global, entorno |

## 3. Módulos

Cada dominio es un módulo NestJS autocontenido (arquitectura modular por feature):

- **Auth** (`src/auth/`): registro/login local, OAuth Google (código e ID token), invitados, refresh tokens, verificación por email, JWT (guard + estrategia).
- **Users** (`src/users/`): CRUD de usuarios, borrado lógico (`pendingDeletion`).
- **Exams** (`src/exams/`): exámenes quiz/ICFES generados por IA o manuales, con preguntas y opciones.
- **FlashCards** (`src/flash-cards/`): mazos de tarjetas (`Card`) con tarjetas individuales (`FlashCard`).
- **Notes** (`src/notes/`): notas con contenido enriquecido (Markdown) en tabla separada (`NoteContent`).
- **Messages** (`src/messages/`): chats y mensajes con el asistente IA, JSON o streaming SSE.
- **Gemini** (`src/gemini/`): servicio de IA con rotación de API keys, fallback de modelos, salida JSON por esquema y soporte multimodal.
- **Credits** (`src/credits/`): créditos diarios por usuario (30/día) para consumo de generación IA.
- **Likes** (`src/likes/`): likes polimórficos sobre exam/card/note.
- **GlobalChat** (`src/global-chat/`): chat comunitario global.
- **ExamAttempts** (`src/exam-attempts/`): registro de intentos de exámenes y estadísticas; formatters para `deck` y `exam`.

## 4. Arranque y middleware global (`src/main.ts`)

1. `NestFactory.create` con `ExpressAdapter`.
2. **CORS**: orígenes desde `CORS_ORIGINS` (env, separados por coma).
3. **Rate limiting** por ruta sensible: `/auth` (20 req/15 min), generación IA por tema (20 req/hora), subida de archivos (30/día), generación desde archivo (10/día).
4. **Helmet** con CSP estricto, HSTS, iframe deny, etc.
5. **Estáticos**: carpeta `uploads/` servida en `/uploads/`.
6. **Límite de payload**: 1 MB para bodies (se salta rutas de archivos, manejadas por Multer).
7. **ValidationPipe global**: `whitelist`, `forbidNonWhitelisted`, `transform` — rechaza propiedades no definidas en DTOs.
8. **Sanitización XSS**: elimina `<script>` y manejadores de eventos (`on\w+="..."`) del body, permitiendo Markdown.
9. **Filtro global** de excepciones (`AllExceptionsFilter`) con respuesta uniforme.
10. **Logging de seguridad** (solo dev): errores 4xx/5xx y peticiones lentas (>5s).
11. **ApiKeyGuard global**: exige `x-api-key` salvo rutas públicas (`/health`, `/ping`, `/auth/*`) o usuario JWT autenticado.

## 5. Autenticación (flujo)

- **Local**: `bcryptjs` para hash de contraseña → JWT (24h, configurable) + refresh token (hash SHA-256 almacenado).
- **JWT**: `JwtModule` registrado de forma asíncrona leyendo `JWT_SECRET`/`JWT_EXPIRATION` de env; `JwtStrategy` valida `sub`, `email`, `name`, `isGuest`.
- **Google OAuth**: `passport-google-oauth20` (redirect) + intercambio de código con `fetch` a Google; también acepta ID token del frontend (`google-auth-library`).
- **Invitado**: JWT sin persistencia en BD (`isGuest: true`).
- **Guards**: `JwtGuard` (verificación directa con `JwtService`), `JwtAuthGuard` (passport), `RequireAuthGuard` (bloquea invitados), `AllowGuestDecorator` (permite rutas invitadas).

## 6. Integración con Gemini (`src/gemini/gemini.service.ts`)

- Claves múltiples desde env (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`) con **rotación automática** ante HTTP 429.
- **Fallback de modelos**: `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash-lite` → `gemini-1.5-flash`.
- **Salida estructurada**: `responseSchema` (JSON mode) para exámenes, notas y flashcards; un `JsonExtractor` limpia markdown residual.
- **Multimodal**: archivos en base64 vía `inlineData` para exámenes/flashcards desde archivo y chat con archivos.
- **Streaming SSE**: `generateContentStream` para el chat educativo.
- Prompts centralizados en `src/gemini/AI_PROMPTS.ts`.

## 7. Persistencia (TypeORM + PostgreSQL)

- `autoLoadEntities: true`, `synchronize: true` (**solo desarrollo** — en producción usar migraciones y `synchronize: false`).
- SSL opcional vía `SSL=true` con `rejectUnauthorized: false` (típico en Aiven/Neon).

Entidades principales y relaciones:

```
User 1───* Note 1───1 NoteContent
User 1───* Exam 1───* ExamQuestion 1───* ExamOption
User 1───* Card 1───* FlashCard
User 1───* Chat 1───* Message
User 1───* DailyCredits
User 1───* CardLike (polimórfico: exam | card | note)
User 1───* ExamAttempt
```

- Índices: `userId` en todas las entidades de contenido, `createdAt` en Chat/Message.
- Borrado en cascada para contenido hijo (`NoteContent`, `ExamQuestion`, `FlashCard`, `Message`).
- Códigos de compartir de 5 caracteres alfanuméricos en `Note`, `Exam`, `Card`.
- `CardLike` tiene UNIQUE `[userId, cardType, cardId]`.

## 8. Manejo de archivos

- Subida vía Multer (`file-storage.service.ts`, tipos en `common/types/upload.type.ts`).
- Se guardan en `uploads/` (gitignored) y se sirven estáticamente en `/uploads/`.
- Los archivos también se envían en base64 a Gemini para análisis.

## 9. Seguridad

| Riesgo | Mitigación |
|--------|-----------|
| Abuso de autenticación | Rate limit 20 req/15 min en `/auth` |
| Costos de IA | Créditos diarios + rate limit por generación |
| Payload grande | Límite 1 MB por request (413) |
| XSS | Sanitización de `<script>`/event handlers en body + CSP de Helmet |
| Inyección SQL | TypeORM con parámetros (query builder) |
| Acceso no autorizado | ApiKeyGuard global + JWT + RequireAuth |
| Fuga de secretos | Todo configurable por entorno (`.env` gitignored, `.env.example` con placeholders) |
| Clickjacking | `frameguard: deny` |

## 10. Configuración por entorno

Todas las variables sensibles viven en `.env` (ver `.env.example`). El proyecto usa `@nestjs/config` global; los servicios inyectan `ConfigService` (Gemini, Mail) o leen `process.env` cargado por el ConfigModule. `CORS_ORIGINS` permite desplegar en cualquier dominio sin tocar código.

## 11. Despliegue sugerido

1. `npm ci && npm run build`
2. Variables de entorno completas en el proveedor (Render, Railway, VPS + PM2...).
3. `NODE_ENV=production`, `synchronize=false` y migraciones de TypeORM.
4. Reverse proxy (Nginx/Caddy) con HTTPS; `BACKEND_URL` apuntando al dominio público.

## 12. Estructura de directorios

```
src/
├── app.module.ts / app.controller.ts / app.service.ts
├── main.ts
├── auth/            # autenticación, JWT, OAuth, mail
├── users/           # gestión de usuarios
├── exams/           # exámenes quiz/ICFES
├── flash-cards/     # mazos y tarjetas
├── notes/           # notas con contenido
├── messages/        # chats con IA (JSON/SSE)
├── gemini/          # servicio de IA, prompts, schemas
├── credits/         # créditos diarios
├── likes/           # likes polimórficos
├── global-chat/     # chat comunitario
├── exam-attempts/   # intentos y estadísticas
└── common/          # guards, filtros, decoradores, storage, utils
```