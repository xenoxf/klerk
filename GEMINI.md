# GEMINI.md - Klerk Backend Project Context

> Auto-generated technical documentation for Gemini CLI operational context.
> Last updated: 2026-04-15

---

## PROJECT OVERVIEW

**Klerk** is a NestJS v10 backend API for an educational platform (LearnYOS). It provides AI-powered generation of study materials (exams, flashcards, notes) using Google Gemini, user authentication (local + Google OAuth), a credit system for AI usage tracking, and real-time chat functionality.

**Tech Stack:**
- **Framework:** NestJS 10 (TypeScript, Express under the hood)
- **Database:** PostgreSQL (via TypeORM 0.3.27, `pg` driver)
- **AI/LLM:** Google Gemini (`@google/generative-ai` v0.24.1)
- **Auth:** JWT (passport-jwt), Google OAuth2 (passport-google-oauth20), bcryptjs
- **Security:** Helmet, rate limiting (@nestjs/throttler + express-rate-limit), XSS sanitization, ValidationPipe
- **Mail:** nodemailer (Gmail SMTP)
- **Testing:** Jest

---

## PROJECT STRUCTURE

```
klerk/
├── src/
│   ├── main.ts                          # Entry point, CORS, rate limiting, security middleware
│   ├── app.module.ts                    # Root module (Config, TypeOrm, all features)
│   ├── app.controller.ts                # Health check endpoints (/, /health, /ping)
│   ├── app.service.ts
│   │
│   ├── auth/                            # Authentication module
│   │   ├── auth.controller.ts           # /auth/* endpoints
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts               # @Global() module
│   │   ├── mail.service.ts              # Email sending via nodemailer
│   │   ├── dto/                         # CreateAuthDto, LoginAuthDto, UpdateAuthDto
│   │   ├── jwt/                         # JwtStrategy, JwtGuard
│   │   └── strategies/                  # GoogleStrategy (OAuth2)
│   │
│   ├── users/                           # User management
│   │   ├── users.controller.ts          # /users/* endpoints
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── dto/                         # CreateUserDto, UpdateUserDto, CreateGoogleUserDto
│   │   └── entities/user.entity.ts      # User entity
│   │
│   ├── notes/                           # Study notes (AI-generated + manual)
│   │   ├── notes.controller.ts          # /notes/* endpoints
│   │   ├── notes.service.ts
│   │   ├── notes.module.ts
│   │   ├── dto/                         # GenerateNoteDto, CreateNoteDto, UpdateNoteDto
│   │   └── entities/                    # note.entity.ts, note-content.entity.ts
│   │
│   ├── exams/                           # AI-generated exams (quiz/ICFES)
│   │   ├── exams.controller.ts          # /exams/* endpoints
│   │   ├── exams.service.ts
│   │   ├── exams.module.ts
│   │   ├── dto/                         # GenerateExamDto, CreateExamDto, UpdateExamDto
│   │   └── entities/                    # exam.entity.ts, examQuestion.entity.ts, exam-option.entity.ts
│   │
│   ├── flash-cards/                     # AI-generated flashcards
│   │   ├── flash-cards.controller.ts    # /flash-cards/* endpoints
│   │   ├── flash-cards.service.ts
│   │   ├── flash-cards.module.ts
│   │   ├── dto/                         # GenerateFlashCardsDto, CreateFlashCardDto, UpdateFlashCardDto
│   │   └── entities/                    # flash-card.entity.ts, card.entity.ts
│   │
│   ├── messages/                        # AI chat conversations
│   │   ├── messages.controller.ts       # /messages/* endpoints
│   │   ├── messages.service.ts
│   │   ├── messages.module.ts
│   │   ├── dto/                         # CreateMessageDto, UpdateMessageDto
│   │   └── entities/                    # chat.entity.ts, message.entity.ts
│   │
│   ├── gemini/                          # Gemini AI service wrapper
│   │   ├── gemini.controller.ts         # /gemini/* endpoints
│   │   ├── gemini.service.ts            # Core AI integration (exam, note, flashcard, chat)
│   │   ├── gemini.module.ts
│   │   └── AI_PROMPTS.ts                # 514 lines of AI system prompts
│   │
│   ├── likes/                           # Like system for content
│   │   ├── likes.controller.ts          # /likes/* endpoints
│   │   ├── likes.service.ts
│   │   ├── likes.module.ts
│   │   └── entities/card-like.entity.ts
│   │
│   ├── credits/                         # Daily credit usage system
│   │   ├── credits.controller.ts        # /credits/* endpoints
│   │   ├── credits.service.ts
│   │   ├── credits.module.ts
│   │   └── entities/daily-credits.entity.ts
│   │
│   ├── global-chat/                     # Public chat messages
│   │   ├── global-chat.controller.ts    # /global-chat/* endpoints
│   │   ├── global-chat.service.ts
│   │   ├── global-chat.module.ts
│   │   ├── dto/                         # CreateGlobalChatMessageDto
│   │   └── entities/global-chat-message.entity.ts
│   │
│   ├── exam-attempts/                   # Exam attempt tracking
│   │   ├── exam-attempts.controller.ts  # /exam-attempts/* endpoints
│   │   ├── exam-attempts.service.ts
│   │   ├── exam-attempts.module.ts
│   │   └── entities/exam-attempt.entity.ts
│   │
│   └── common/                          # Shared utilities
│       ├── guards/                      # ApiKeyGuard, RequireAuthGuard, GoogleAuthGuard
│       ├── decorators/                  # @RequireAuth(), @AllowGuest()
│       ├── filters/                     # AllExceptionsFilter
│       └── utils/                       # shared.utils.ts
│
├── .env                                 # Environment variables (DB, JWT, API keys, OAuth)
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript config (ES2021, decorators enabled)
├── nest-cli.json                        # NestJS CLI config
├── .eslintrc.js
├── .prettierrc
└── .gitignore
```

---

## HOW TO RUN THE PROJECT

### Prerequisites
- **Node.js** (v18+ recommended, per package.json `@types/node: ^20.3.1`)
- **PostgreSQL** database (configured in `.env`)
- **Google Gemini API key** (configured in `.env` as `GEMINI_API_KEY`)
- **Google OAuth credentials** (if using Google sign-in)

### Installation
```bash
npm install
```

### Development
```bash
npm run start:dev        # Hot-reload dev server (nest start --watch)
npm run start:debug      # Debug mode with --debug --watch
```

### Production
```bash
npm run build            # Compile TypeScript to dist/ (tsc -p tsconfig.build.json)
npm run start:prod       # Run compiled JS (node dist/main)
```

### Testing
```bash
npm run test             # Run unit tests (Jest)
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:debug       # Debug mode (node --inspect-brk)
npm run test:e2e         # E2E tests (jest --config ./test/jest-e2e.json)
```

### Linting & Formatting
```bash
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

**Server listens on:** `0.0.0.0:2300` (controlled by `PORT` in `.env`)

---

## ENVIRONMENT VARIABLES (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `API_KEY` | Global API key for ApiKeyGuard (header: `x-api-key`) | `HFUIHFI...` |
| `JWT_SECRET` | JWT signing secret | `dghsfas...` |
| `JWT_EXPIRATION` | JWT token expiration | `24h` |
| `DB_HOST` | PostgreSQL host | `***REMOVED***` |
| `DB_PORT` | PostgreSQL port | `27423` |
| `DB_USER` | DB username | `avnadmin` |
| `DB_PASS` | DB password | `AVNS_yyZ...` |
| `DB_NAME` | Database name | `defaultdb` |
| `GEMINI_API_KEY` | Google Gemini API key (primary) | `AIzaSyA...` |
| `GEMINI_API_KEY_2` | Google Gemini API key (fallback) | `AIzaSyD...` |
| `MAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | `***REMOVED***` |
| `MAIL_PASS` | SMTP password | `***REMOVED***` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `4804289...` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:2300/auth/google/callback` |
| `PORT` | Server port | `2300` |
| `NODE_ENV` | Environment | `development` |
| `SSL` | DB SSL mode | `true` |
| `BACKEND_URL` | Backend base URL | `http://localhost:2300` |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:3000` |

---

## API ENDPOINTS

### App Controller
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Hello message |
| GET | `/health` | Health check |
| GET | `/ping` | Returns "pong" |

### Auth Controller (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | API Key | Register new user (email/password) |
| POST | `/auth/login` | API Key | Login (email/password) → returns JWT |
| GET | `/auth/google/url` | API Key | Get Google OAuth authorization URL |
| GET | `/auth/google/callback` | API Key | Google OAuth callback (redirect) |
| POST | `/auth/google/callback` | API Key | Google OAuth callback (POST with code) |
| POST | `/auth/google` | API Key | Google auth with ID token |
| POST | `/auth/logout` | API Key | Logout (invalidate refresh token) |
| POST | `/auth/refresh` | API Key | Refresh access token |
| GET | `/auth/me` | API Key + JWT | Get current user profile |
| GET | `/auth/verify_token` | API Key + JWT | Verify JWT token validity |
| POST | `/auth/guest` | API Key | Guest login (temporary, no DB persistence) |

### Users Controller (`/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | JWT + RequireAuth | Get current user's data |
| GET | `/users/:id` | JWT + RequireAuth | Get user by ID |
| PUT | `/users/name` | JWT + RequireAuth | Update current user's name |
| PATCH | `/users/:id` | JWT + RequireAuth | Update user by ID |
| DELETE | `/users/:id` | JWT + RequireAuth | Delete user (soft delete with pendingDeletion) |

### Notes Controller (`/notes`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notes/generate/topic_or_reference` | JWT + RequireAuth | AI-generate notes (consumes credits) |
| GET | `/notes` | JWT | Get all notes for current user |
| GET | `/notes/public` | JWT | Get public notes (all users) |
| GET | `/notes/private` | JWT + RequireAuth | Get private notes |
| GET | `/notes/search` | JWT | Search notes (?q=&limit=&offset=&searchInContent=) |
| POST | `/notes` | JWT + RequireAuth | Create note manually |
| GET | `/notes/code/:code` | JWT | Get note by sharing code (5-char alphanumeric) |
| GET | `/notes/:id` | JWT | Get note by ID |
| PATCH | `/notes/:id` | JWT + RequireAuth | Update note |
| GET | `/notes/locked/:id` | JWT + RequireAuth | Get locked note (owner only) |
| DELETE | `/notes/:id` | JWT + RequireAuth | Delete note |
| DELETE | `/notes/all` | JWT + RequireAuth | Delete all notes for user |

### Exams Controller (`/exams`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/exams/generate/topic_or_reference` | JWT + RequireAuth | AI-generate exam (consumes credits) |
| GET | `/exams` | JWT | Get public exams deck |
| GET | `/exams/private` | JWT + RequireAuth | Get user's private exams |
| GET | `/exams/public` | JWT | Get public exams deck |
| GET | `/exams/code/:code` | JWT | Get exam by sharing code |
| GET | `/exams/play/:id` | JWT | Get exam for playing (with questions) |
| GET | `/exams/locked/:id` | JWT + RequireAuth | Get locked exam (owner only) |
| GET | `/exams/deck` | JWT | Get user's exams deck |
| GET | `/exams/search` | JWT | Search exams (?q=&limit=&offset=&searchInQuestions=) |
| GET | `/exams/score` | JWT + RequireAuth | Update exam score (auto-records attempt) |
| GET | `/exams/:id` | JWT | Get exam by ID |
| PUT | `/exams/:id` | JWT + RequireAuth | Update exam |
| DELETE | `/exams/:id` | JWT + RequireAuth | Delete exam |
| DELETE | `/exams/all` | JWT + RequireAuth | Delete all exams for user |

### FlashCards Controller (`/flash-cards`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/flash-cards/generate/topic_or_reference` | JWT + RequireAuth | AI-generate flashcards (consumes credits) |
| GET | `/flash-cards` | JWT | Get all user's cards |
| GET | `/flash-cards/public` | JWT | Get public cards deck |
| GET | `/flash-cards/private` | JWT + RequireAuth | Get user's private cards |
| GET | `/flash-cards/search` | JWT | Search flashcards (?q=&limit=&offset=&searchInCards=) |
| GET | `/flash-cards/klek/:id` | JWT | Get card in "klek" format |
| GET | `/flash-cards/locked/:id` | JWT + RequireAuth | Get locked card (owner only) |
| GET | `/flash-cards/code/:code` | JWT | Get card by sharing code |
| GET | `/flash-cards/:id` | JWT | Get card by ID |
| POST | `/flash-cards` | JWT + RequireAuth | Create card manually |
| PATCH | `/flash-cards/:id` | JWT + RequireAuth | Update card |
| DELETE | `/flash-cards/:id` | JWT + RequireAuth | Delete card |
| DELETE | `/flash-cards/all` | JWT + RequireAuth | Delete all cards for user |

### Messages Controller (`/messages`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/messages/send` | JWT + RequireAuth | Send message with AI response (JSON) |
| POST | `/messages/send/stream` | JWT + RequireAuth | Send message with AI SSE stream (Server-Sent Events) |
| POST | `/messages/chats` | JWT + RequireAuth | Create new chat |
| GET | `/messages/chats` | JWT + RequireAuth | Get user's chats |
| GET | `/messages/chat/:chatId` | JWT + RequireAuth | Get chat messages |
| DELETE | `/messages/chat/:chatId` | JWT + RequireAuth | Delete chat |

### Likes Controller (`/likes`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/likes/exams/:id` | JWT + RequireAuth | Toggle like on exam |
| POST | `/likes/flashcards/:id` | JWT + RequireAuth | Toggle like on flashcard |
| POST | `/likes/notes/:id` | JWT + RequireAuth | Toggle like on note |
| GET | `/likes/exams/:id` | JWT | Get exam like count + userLiked status |
| GET | `/likes/flashcards/:id` | JWT | Get flashcard like count + userLiked status |
| GET | `/likes/notes/:id` | JWT | Get note like count + userLiked status |

### Credits Controller (`/credits`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/credits/status` | JWT + RequireAuth | Get user's credit status |
| GET | `/credits/costs` | None (public) | Get credit costs configuration |

### GlobalChat Controller (`/global-chat`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/global-chat/messages` | JWT | Get all messages (last 50) |
| POST | `/global-chat/message` | JWT + RequireAuth | Create message |
| GET | `/global-chat/user/messages` | JWT + RequireAuth | Get user's messages |
| DELETE | `/global-chat/message/:id` | JWT + RequireAuth | Delete message (owner only) |

### ExamAttempts Controller (`/exam-attempts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/exam-attempts` | JWT + RequireAuth | Record exam attempt |
| GET | `/exam-attempts` | JWT + RequireAuth | Get user's attempts |
| GET | `/exam-attempts/stats` | JWT + RequireAuth | Get user's attempt stats |

### Gemini Controller (`/gemini`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gemini/health` | None | Gemini service health check |

---

## DATABASE SCHEMA (TypeORM Entities)

### User
```
id: number (PK, auto)
email: string (unique, nullable)
name: string
password: string (nullable)
avatar: string (nullable)
refreshToken: string (SHA-256 hashed)
refreshTokenExpiresAt: Date
provider: string (default: 'local')
providerId: string (unique, nullable)
picture: string (nullable)
pendingDeletion: boolean
deletionDate: Date (nullable)
```

### Note
```
id: number (PK)
code: string (5-char sharing code)
title: string
tema: string
area: string
description: string
acceso: string (default: 'publico')
levelOfDetail: string
createdAt: Date
userId: number (FK → User, indexed)
```

### NoteContent
```
id: number (PK)
content: text
noteId: number (FK → Note, onDelete: CASCADE)
userId: number
createdAt: Date
```

### Exam
```
id: number (PK)
title: string
tema: string
area: string
description: string
acceso: string (default: 'publico')
code: string (5-char sharing code)
totalQuestions: number (default: 0)
difficulty: string
type: string ('quiz' | 'icfes')
score: number
createdAt: Date
userId: number (FK → User, indexed)
```

### ExamQuestion
```
id: number (PK)
question: text
explanation: text
contextId: string
contextContent: text
examId: number (FK → Exam, onDelete: CASCADE)
```

### ExamOption
```
id: number (PK)
text: string
isCorrect: boolean (default: false)
feedback: string (nullable)
questionId: number (FK → ExamQuestion, onDelete: CASCADE)
```

### Card
```
id: number (PK)
code: string (5-char sharing code)
title: string
tema: string
area: string
description: string
acceso: string (default: 'publico')
createdAt: Date
userId: number (FK → User, indexed)
```

### FlashCard
```
id: number (PK)
front: text
back: text
hint: string (nullable)
cardId: number (FK → Card, onDelete: CASCADE)
userId: number
```

### Chat
```
id: number (PK)
title: string
createdAt: Date (indexed)
updatedAt: Date (indexed)
userId: number (FK → User, indexed)
```

### Message
```
id: number (PK)
response: text
prompt: text
createdAt: Date (indexed)
userId: number (indexed)
chatId: number (FK → Chat, onDelete: CASCADE)
```

### CardLike
```
id: number (PK)
userId: number (FK → User, onDelete: CASCADE)
cardType: string ('exam' | 'card' | 'note')
cardId: number
createdAt: Date
UNIQUE constraint: [userId, cardType, cardId]
```

### DailyCredits
```
id: string (UUID PK)
userId: number (FK → User, onDelete: CASCADE)
date: Date (unique index with userId)
totalCredits: number (default: 30)
usedCredits: number (default: 0)
remainingCredits: number (default: 30)
examGenerations: number
noteGenerations: number
flashcardGenerations: number
chatMessages: number
createdAt: Date
updatedAt: Date
```

### GlobalChatMessage
```
id: number (PK)
content: text (max 500)
userId: number (FK → User, eager load, onDelete: CASCADE)
createdAt: Date
```

### ExamAttempt
```
id: number (PK)
userId: number (FK → User, onDelete: CASCADE)
examId: number (FK → Exam, onDelete: CASCADE)
correctAnswers: number
totalQuestions: number
examTitle: string
attemptedAt: Date
```

### Entity Relationships
```
User 1---* Note 1---* NoteContent
     1---* Exam 1---* ExamQuestion 1---* ExamOption
     1---* Card 1---* FlashCard
     1---* Chat 1---* Message
     1---* CardLike (polymorphic: exam/card/note)
     1---* DailyCredits
     1---* GlobalChatMessage
     1---* ExamAttempt
Exam 1---* ExamAttempt
```

---

## SECURITY ARCHITECTURE

### Authentication Layers (3 tiers)
1. **ApiKeyGuard** (global): Checks `x-api-key` header against `process.env.API_KEY`. Auto-allows paths: `/auth/*`, `/health`, `/ping`, `/credits/costs`, and browser requests not starting with `/api/`.
2. **JwtGuard** (controller-level): Validates Bearer token from `Authorization` header, populates `request.user` with `{id, email, isGuest}`.
3. **RequireAuthGuard** (handler-level): Uses `@RequireAuth()` decorator metadata. Throws 403 if user is guest (`isGuest === true`).

### Guest User Support
- Guest users receive JWT tokens with `isGuest: true` but are NOT persisted in DB
- Can read public content but cannot create/modify resources
- Temporary authentication for exploration

### Rate Limiting
| Scope | Limit | Applied To |
|-------|-------|------------|
| Global (ThrottlerModule) | 10 req / min per IP | All endpoints |
| Auth-specific | 20 req / 15 min per IP | `/auth` routes |
| AI generation | 20 req / hour per IP | `/exams/generate/*`, `/flash-cards/generate/*`, `/notes/generate/*` |

### Security Middleware (in main.ts)
- **Helmet**: CSP, HSTS, XSS protection headers
- **XSS Sanitization**: Strips `<script>` tags, HTML tags, `on*` event handlers from request body
- **Payload Size Limiter**: Rejects bodies > 1MB for non-GET requests
- **Security Logger**: Logs 4xx/5xx errors and slow requests (>5s) in non-production

### Validation
- Global `ValidationPipe` with: `whitelist=true`, `forbidNonWhitelisted=true`, `transform=true`, `enableImplicitConversion=true`
- All DTOs use `class-validator` decorators

---

## CREDIT SYSTEM

**File:** `src/credits/credits.service.ts`

- **Daily allocation:** 30 credits per user per day (reset daily)
- **Base costs:**
  - EXAM_GENERATION: 3 credits
  - NOTE_GENERATION: 2 credits
  - FLASHCARD_GENERATION: 2 credits
  - CHAT_MESSAGE: 1 credit

- **Dynamic pricing:**
  - Exams: +0.5 per question, difficulty multiplier (0.8x to 3.0x), +1 for long topics
  - Notes: detail multiplier (breve=1.0x, medio=1.4x, detallado=1.9x)
  - Flashcards: +0.4 per card

- **Insufficient credits:** Throws `ForbiddenException` with `errorCode: 'INSUFFICIENT_CREDITS'`

---

## AI/LLM INTEGRATION (GeminiService)

**File:** `src/gemini/gemini.service.ts`

### Model Fallback Chain
1. `gemini-2.5-flash-lite` (primary)
2. `gemini-2.5-flash`
3. `gemini-2.0-flash`
4. `gemini-1.5-flash`

Automatic retry on 429 (rate limit) and 5xx errors.

### Capabilities
| Method | Input | Output |
|--------|-------|--------|
| `generateExam(topic, numQuestions, difficulty)` | Topic string, count, difficulty level | JSON exam with questions, options, correct answers |
| `generateIcfesExam(...)` | Topic, context | JSON with context-grouped questions (ICFES format) |
| `generateNote(topic, numNotes, levelOfDetail)` | Topic, count, detail level | JSON note with content sections |
| `generateFlashcards(topic, numCards)` | Topic, count | JSON flashcards (front/back/hint) |
| `generateEducationalChatResponse(userMessage, history)` | Message + chat history | Text AI response |
| `generateEducationalChatResponseStream(...)` | Message + history | AsyncIterable SSE stream for real-time responses |
| `generateChatTitleFromMessage(firstMessage)` | First chat message | Short title string |

### AI Prompts
**File:** `src/gemini/AI_PROMPTS.ts` (514 lines)
Contains detailed system prompts for each AI generation type.

---

## KEY PATTERNS & CONVENTIONS

1. **Access Control:** Every content entity (Note, Exam, Card) has `acceso` field ('publico'/'privado') and `code` (5-char alphanumeric sharing code)

2. **Response Sanitization:** Services use `refactor` methods to strip sensitive fields (userId, code, levelOfDetail) before returning to frontend

3. **Shuffle:** Public/private deck endpoints use Fisher-Yates shuffle for randomized order

4. **Search:** Full-text search across title, description, tema, area, code, and optionally content/questions/cards

5. **SSE Streaming:** `/messages/send/stream` supports Server-Sent Events for real-time AI responses

6. **No Interceptors:** Application does not use NestJS interceptors

7. **TypeORM synchronize: true:** Database schema auto-synced on startup (dev-only; should be `false` in production)

8. **Refresh Token Rotation:** SHA-256 hashed refresh tokens stored in DB, 30-day expiry, rotated on each refresh

9. **@Global() AuthModule:** Auth module is globally available; JwtModule and AuthService can be injected anywhere

10. **Exception Handling:** `AllExceptionsFilter` catches all exceptions, maps to structured JSON: `{status, path, timestamp, message, error, details?, errorCode?, aiResponse?}`

---

## TESTING STRATEGY

- **Framework:** Jest with ts-jest
- **Test files:** `*.spec.ts` files in `src/` directory
- **Config:** Jest config in `package.json`
- **Coverage:** `npm run test:cov` generates coverage in `../coverage` directory
- **E2E tests:** Separate config in `test/jest-e2e.json`
- **Test patterns:** Unit tests exist for app.controller; other modules may need test files created

---

## AREAS REQUIRING INSPECTION

1. **Production readiness:** `synchronize: true` in TypeORM should be set to `false` before deployment
2. **Error handling:** Verify all exceptions are properly caught and mapped by AllExceptionsFilter
3. **Rate limiting effectiveness:** Current limits may need adjustment based on actual traffic patterns
4. **Guest user limitations:** Guest users cannot persist data; verify this doesn't break any workflows
5. **AI prompt quality:** `AI_PROMPTS.ts` (514 lines) should be reviewed for accuracy and bias
6. **Database migrations:** No migration files found; schema changes rely on `synchronize: true` (not suitable for production)
7. **Missing e2e tests:** Only unit tests found; e2e test coverage unknown
8. **Refresh token cleanup:** No cron job found for expired token cleanup

---

## DEBUGGING TIPS

1. **Server startup issues:** Check `.env` file for missing DB credentials or API keys
2. **Auth failures:** Verify `JWT_SECRET` matches between development and production; check `x-api-key` header
3. **AI generation failures:** Gemini API keys may be rate-limited or invalid; check `gemini.service.ts` logs
4. **Database connection:** PostgreSQL requires SSL connection (per `SSL=true` in `.env`)
5. **Rate limiting:** Check `ThrottlerModule` and `express-rate-limit` configurations in `main.ts`
6. **CORS issues:** Allowed origins defined in `main.ts`: `localhost:3000`, `learnyos.vercel.app`, `klerk.onrender.com`, `learnyos-love.vercel.app`
7. **Exception logs:** Check console output for `AllExceptionsFilter` logs (prefix: "Exceptions")

---

## COMMON DEVELOPMENT TASKS

### Add a new endpoint
1. Create/update module in appropriate feature directory
2. Add controller method with appropriate guards/decorators
3. Create DTO in `dto/` directory with validation decorators
4. Create entity in `entities/` directory if needed
5. Update `app.module.ts` imports if creating new module
6. Add credit check if AI generation is involved

### Add a new AI generation endpoint
1. Add method to `gemini.service.ts` with prompt from `AI_PROMPTS.ts`
2. Create DTO with topic/reference and quantity parameters
3. Add credit cost calculation in `credits.service.ts`
4. Add controller endpoint with `JwtGuard` + `RequireAuthGuard`
5. Implement fallback chain for model errors

### Debug an endpoint
1. Check controller → service → repository chain
2. Verify guards are not blocking access
3. Check DTO validation (class-validator decorators)
4. Verify database entity relationships
5. Check AI service logs for Gemini errors
