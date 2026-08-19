# Klerk API

API backend de una plataforma educativa impulsada por IA (Google Gemini): genera **exámenes, flashcards y notas** a partir de un tema o archivo, con chat educativo en streaming, créditos diarios y sistema de compartir contenido.

> Construida con **NestJS**, **TypeORM + PostgreSQL** y **Gemini API**.

## ✨ Características

- **Generación con IA**: exámenes (quiz e ICFES), flashcards y notas desde un tema o desde archivos (PDF, imágenes).
- **Chat educativo**: respuestas JSON y streaming SSE, con soporte multimodal (archivos adjuntos).
- **Autenticación**: email/contraseña (verificación por correo), Google OAuth y modo invitado.
- **JWT seguro** con refresh tokens y expiración configurable.
- **Créditos diarios**: 30 créditos por usuario/día para generar contenido con IA.
- **Contenido público/privado**: comparte material con códigos de 5 caracteres; los demás pueden verlo y dar likes.
- **Chat global** entre usuarios.
- **Historial de intentos de exámenes** con estadísticas.
- **Seguridad**: Helmet, rate limiting por endpoint, validación estricta de DTOs, sanitización XSS, límites de payload, guard de API key.

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 10 |
| ORM | TypeORM 0.3 + PostgreSQL |
| IA | Google Generative AI (`@google/generative-ai`) |
| Auth | Passport (JWT + Google OAuth 2.0), bcryptjs |
| Email | Nodemailer (SMTP) |
| Seguridad | Helmet, express-rate-limit, class-validator |
| Tests | Jest |

## 🚀 Requisitos

- Node.js ≥ 18
- PostgreSQL (o un servicio como Aiven/Neon)
- Una API key de [Google AI Studio](https://aistudio.google.com/)
- (Opcional) Cliente OAuth 2.0 de Google y credenciales SMTP

## ⚙️ Configuración

1. Clona el repositorio e instala dependencias:

```bash
git clone <url-del-repo>
cd klerk
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Completa `.env` con tus valores (ver `.env.example`). Los más importantes:

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | Conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firmar JWT (genera uno con `openssl rand -base64 48`) |
| `API_KEY` | Clave global requerida en el header `x-api-key` |
| `GEMINI_API_KEY`, `GEMINI_API_KEY_2` | Claves de Gemini (se rotan automáticamente ante rate limit 429) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth de Google (opcional) |
| `MAIL_USER`, `MAIL_PASS` | SMTP para verificación de email (opcional) |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma |

> ⚠️ **Nunca** subas tu `.env` real al repositorio. Ya está en `.gitignore`.

## ▶️ Ejecución

```bash
npm run start:dev    # desarrollo con watch
npm run build        # compilar a dist/
npm run start:prod   # producción
```

El servidor escucha en `http://localhost:2300` (configurable con `PORT`).

## 🔑 Autenticación

Todos los endpoints (excepto los públicos) requieren un header:

```
x-api-key: <tu API_KEY>
Authorization: Bearer <token JWT>
```

Flujo básico:

1. `POST /auth/register` o `POST /auth/login` → devuelve `accessToken` y `refreshToken`.
2. Envía el `accessToken` como `Authorization: Bearer ...`.

## 📚 Endpoints principales

| Módulo | Endpoints |
|--------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/me`, `/auth/guest` |
| Generación IA | `POST /exams/generate/topic_or_reference`, `POST /flash-cards/generate/topic_or_reference`, `POST /notes/generate/topic_or_reference` |
| Exámenes | `/exams`, `/exams/play/:id`, `/exams/code/:code`, `/exams/search`, `/exams/deck` |
| Flashcards | `/flash-cards`, `/flash-cards/code/:code`, `/flash-cards/search` |
| Notas | `/notes`, `/notes/code/:code`, `/notes/search` |
| Chat | `POST /messages/send`, `POST /messages/send/stream` (SSE), `/messages/chats` |
| Comunidad | `/likes/exams/:id`, `/global-chat/messages` |
| Créditos | `/credits/status`, `/credits/costs` |
| Intentos | `/exam-attempts`, `/exam-attempts/stats` |
| Health | `/health`, `/ping`, `/gemini/health` |

La lista completa está en [GEMINI.md](./GEMINI.md) y los detalles técnicos en [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🧪 Tests y calidad

```bash
npm run test       # unit tests (Jest)
npm run test:e2e   # tests e2e
npm run lint       # ESLint
npm run format     # Prettier
```

## 📄 Licencia

**GNU Affero General Public License v3.0 (AGPL-3.0)** — ver [LICENSE](./LICENSE).

Puedes usar y modificar este código libremente, pero cualquier distribución (incluido el uso como servicio web) **debe** hacerse bajo la misma licencia, de forma pública y gratuita. No está permitida la distribución privada o comercial cerrada del código modificado.

## ⚠️ Aviso de seguridad

Este repositorio fue preparado para publicación: las claves reales fueron retiradas y movidas a variables de entorno, y el historial de git fue purgado de secretos. **Antes de publicar, revoca/rota las credenciales antiguas** (Gemini, Google OAuth, SMTP, `JWT_SECRET`, `API_KEY`), ya que estuvieron expuestas en el historial.