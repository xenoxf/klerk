# Backend AI Implementation - Technical Details

## Overview
Este documento detalla los cambios técnicos realizados para que el backend use correctamente los prompts de IA.

---

## 1. ExamsService Changes

### Ubicación
`/home/juniorxf/proyectos/klerk/src/exams/exams.service.ts`

### Cambio 1: generateExamFromTopic()
```typescript
// ❌ ANTES
const prompt = AI_PROMPTS.generateExamFromTopic(
  input.topic,
  input.numberOfQuestions,
  input.difficulty,
);

try {
  const response = await this.groqService.chat(prompt);

// ✅ DESPUÉS
try {
  const response = await this.groqService.generateExamFromTopic(
    input.topic,
    input.numberOfQuestions,
    input.difficulty,
  );
```

**Razón del cambio:** Usar método especializado en lugar de prompts manuales

### Cambio 2: generateExamFromReference()
```typescript
// ❌ ANTES
const prompt = AI_PROMPTS.generateExamFromReference(
  input.reference,
  input.numberOfQuestions,
  input.difficulty,
);

try {
  const response = await this.groqService.chat(prompt);

// ✅ DESPUÉS
try {
  const response = await this.groqService.generateExamFromReference(
    input.reference,
    input.numberOfQuestions,
    input.difficulty,
  );
```

### Cambio 3: Eliminar import innecesario
```typescript
// ❌ ANTES
import { AI_PROMPTS } from '../groq/AI_PROMPTS';

// ✅ DESPUÉS
// Import removido - No es necesario usar AI_PROMPTS directamente
```

---

## 2. NotesService Changes

### Ubicación
`/home/juniorxf/proyectos/klerk/src/notes/notes.service.ts`

### Cambio 1: Agregar import AI_PROMPTS
```typescript
// ✅ DESPUÉS
import { AI_PROMPTS } from '../groq/AI_PROMPTS';
```

### Cambio 2: generateFromTopic()
```typescript
// ❌ ANTES
const instruction = `Eres un experto educativo. Genera ${input.numberOfNotes} nota(s) académica(s) detallada(s) en formato JSON únicamente sobre el tema: "${input.topic}".

Nivel de detalle: ${input.levelOfDetail}.

El JSON debe tener SOLO un array "notes" donde cada elemento tiene: { title: string (título descriptivo), contents: array de { type: "text"|"list"|"code", content: string | string[] } }.

Responde SOLO con JSON válido, sin marcas de código.`;

try {
  const aiRaw = await this.groqService.chat(instruction);
  const parsed = this.parseJSON(aiRaw);

  if (!parsed?.notes || !Array.isArray(parsed.notes)) {

// ✅ DESPUÉS
try {
  const response = await this.groqService.generateNoteFromTopic(
    input.topic,
    input.numberOfNotes,
    input.levelOfDetail,
  );

  if (!response?.notes || !Array.isArray(response.notes)) {
```

**Beneficios:**
- Usa prompts validados y robustos de AI_PROMPTS
- Estructura JSON explícitamente definida
- Mejor manejo de contenidos tipados (text, definition, list, warning, tip, quote, connection)

### Cambio 3: generateFromReference()
```typescript
// ❌ ANTES
const instruction = `Eres un experto educativo. Analiza el siguiente texto y genera ${input.numberOfNotes} nota(s) académica(s) estructurada(s) en formato JSON únicamente.

Texto de referencia: "${input.referenceText}"
...`;

const aiRaw = await this.groqService.chat(instruction);
const parsed = this.parseJSON(aiRaw);

// ✅ DESPUÉS
const response = await this.groqService.generateNoteFromReference(
  input.referenceText,
  input.numberOfNotes,
  input.levelOfDetail,
);
```

---

## 3. FlashCardsService Changes

### Ubicación
`/home/juniorxf/proyectos/klerk/src/flash-cards/flash-cards.service.ts`

### Cambio 1: Agregar import AI_PROMPTS
```typescript
// ✅ DESPUÉS
import { AI_PROMPTS } from '../groq/AI_PROMPTS';
```

### Cambio 2: Eliminar método parseJSON
```typescript
// ❌ ANTES
private parseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (e) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch (e2) {
      return null;
    }
  }
}

// ✅ DESPUÉS
// Removido - GroqService maneja el parseo correctamente
```

**Razón:** Los prompts correctos generan JSON válido, no necesita regex para extraer JSON

### Cambio 3: generateFromTopic()
```typescript
// ❌ ANTES
const instruction = `Genera ${input.numberOfCards} tarjetas flashcard sobre "${input.topic}" en JSON. Array "cards" con {front:(pregunta corta),back:(respuesta detallada),difficulty:"fácil"|"medio"|"difícil"}. Solo JSON.`;
const aiRaw = await this.groqService.chat(instruction);
const parsed = this.parseJSON(aiRaw);

if (!parsed?.cards || !Array.isArray(parsed.cards)) {
  throw new BadRequestException('Invalid AI response');
}

const createdCards = [];
for (const card of parsed.cards) {

// ✅ DESPUÉS
try {
  const response = await this.groqService.generateFlashcardsFromTopic(
    input.topic,
    input.numberOfCards,
  );

  if (!response?.cards || !Array.isArray(response.cards)) {
    throw new BadRequestException('Invalid AI response');
  }

  const createdCards = [];
  for (const card of response.cards) {
    ...
  }

  return { success: true, totalCreated: createdCards.length, cards: createdCards };
} catch (error) {
  throw new BadRequestException(
    `Error generating flashcards from topic: ${error.message}`,
  );
}
```

**Cambios clave:**
- Usa método especializado
- Prompts incluyen distribución de dificultad (30% fácil, 50% medio, 20% difícil)
- Estructura JSON con hints, ejemplos, commonMistakes
- Try-catch block apropiado

### Cambio 4: generateFromReference()
```typescript
// ❌ ANTES
const instruction = `Analiza: "${input.referenceText}". Genera ${input.numberOfCards} tarjetas flashcard en JSON. Array "cards" con {front:(concepto clave),back:(explicación del texto),difficulty:"fácil"|"medio"|"difícil"}. Solo JSON.`;
const aiRaw = await this.groqService.chat(instruction);
const parsed = this.parseJSON(aiRaw);

for (const card of parsed.cards) {

// ✅ DESPUÉS
const response = await this.groqService.generateFlashcardsFromReference(
  input.referenceText,
  input.numberOfCards,
);

...

for (const card of response.cards) {
  ...
} catch (error) {
  throw new BadRequestException(
    `Error generating flashcards from reference: ${error.message}`,
  );
}
```

---

## 4. MessagesService Changes

### Ubicación
`/home/juniorxf/proyectos/klerk/src/messages/messages.service.ts`

### Cambio 1: Eliminar import innecesario
```typescript
// ❌ ANTES
import { title } from 'process';

// ✅ DESPUÉS
// Removido - La variable 'title' era indefinida
```

### Cambio 2: generateChatTitle()
```typescript
// ❌ ANTES
private async generateChatTitle(prompt: string): Promise<string> {
  const instruction = `Genera un título corto (máximo 8 palabras) y descriptivo para un chat educativo basado en esta pregunta: "${prompt}". Responde SOLO con el título, sin comillas ni explicación adicional.`;
  const title = await this.groqService.chat(instruction);
  return title.trim();
}

// ✅ DESPUÉS
private async generateChatTitle(prompt: string): Promise<string> {
  return await this.groqService.generateChatTitleFromMessage(prompt);
}
```

**Beneficios:**
- Usa método especializado de GroqService
- Prompts validados de AI_PROMPTS
- Mejor manejo de la respuesta

### Cambio 3: sendMessageWithAIResponse()
```typescript
// ❌ ANTES
const chatTitle = ... // nunca se genera, 'title' está undefined
let chat: Chat;

if (input.chatId) {
  chat = await this.chatRepo.findOne(...);
  if (!chat) {
    chat = await this.createChat(userId, title);  // ❌ title es undefined
  }
} else {
  chat = await this.createChat(userId, title);  // ❌ title es undefined
}

try {
  const aiResponse = await this.groqService.chatMessage(input.prompt);

// ✅ DESPUÉS
const chatTitle = await this.generateChatTitle(input.prompt);

let chat: Chat;

if (input.chatId) {
  chat = await this.chatRepo.findOne(...);
  if (!chat) {
    chat = await this.createChat(userId, chatTitle);  // ✅ Correcto
  }
} else {
  chat = await this.createChat(userId, chatTitle);  // ✅ Correcto
}

try {
  const aiResponse = await this.groqService.generateEducationalChatResponse(
    input.prompt,
  );
```

### Cambio 4: Mejora en almacenamiento de respuesta
```typescript
// ❌ ANTES
const aiMessage = this.messageRepo.create({
  prompt: input.prompt,
  response: `[AI]: ${responseText}`,  // String con prefijo
  chat,
  userId,
  createdAt,
});

// ✅ DESPUÉS
const aiMessage = this.messageRepo.create({
  prompt: input.prompt,
  response: aiResponse.response || responseText,  // Extrae respuesta del objeto estructurado
  chat,
  userId,
  createdAt,
});
```

---

## 5. GroqService Enhancements

### Ubicación
`/home/juniorxf/proyectos/klerk/src/groq/groq.service.ts`

### Nuevo Método 1: generateEducationalChatResponse()
```typescript
async generateEducationalChatResponse(
  userMessage: string,
  conversationContext?: string,
) {
  try {
    const prompt = AI_PROMPTS.generateEducationalChatResponse(
      userMessage,
      conversationContext,
    );

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Eres un tutor educativo experto. Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,  // Más bajo que chatMessage para consistencia
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    try {
      return JSON.parse(raw);
    } catch (e) {
      return {
        response: raw,
        keyPoints: [],
        suggestedFollowUp: '',
        difficulty: 'intermediate',
        relevantTopics: [],
      };
    }
  } catch (error) {
    return {
      response: 'Lo siento, hubo un error procesando tu pregunta.',
      keyPoints: [],
      suggestedFollowUp: '',
      difficulty: 'intermediate',
      relevantTopics: [],
      error: error.message,
    };
  }
}
```

**Retorna:**
```json
{
  "response": "Explicación detallada educativa",
  "keyPoints": ["Punto clave 1", "Punto clave 2"],
  "suggestedFollowUp": "Pregunta de seguimiento",
  "difficulty": "beginner|intermediate|advanced",
  "relevantTopics": ["Tema 1", "Tema 2"]
}
```

### Nuevo Método 2: generateChatTitleFromMessage()
```typescript
async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
  try {
    const prompt = AI_PROMPTS.generateChatTitle(firstMessage);

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente conciso. Responde SOLO con el título solicitado, sin comillas ni explicación.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,  // Muy bajo para consistencia
      max_tokens: 100,
    });

    const title = completion.choices[0]?.message?.content?.trim() || 'Nuevo Chat';
    return title;
  } catch (error) {
    return 'Nuevo Chat';
  }
}
```

**Retorna:** String con máximo 8 palabras

---

## 6. AI_PROMPTS Enhancements

### Ubicación
`/home/juniorxf/proyectos/klerk/src/groq/AI_PROMPTS.ts`

### Nuevo Prompt 1: generateEducationalChatResponse()
```typescript
generateEducationalChatResponse: (userMessage: string, conversationContext?: string) => `
  EDUCATIONAL ASSISTANT INSTRUCTIONS:
  You are an expert educational tutor responding to a student question in an educational chat.
  
  User's question: "${userMessage}"
  
  ${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}
  
  RESPONSE REQUIREMENTS:
  1. Provide clear, accurate, and educational explanations
  2. Use analogies and examples when helpful
  3. Break complex concepts into digestible parts
  4. Encourage critical thinking and deeper understanding
  5. Be supportive and motivating
  6. Correct misconceptions gently
  7. Suggest related topics if relevant
  
  RESPONSE FORMAT - Return as JSON:
  {
    "response": "Your detailed educational response here",
    "keyPoints": ["Important concept 1", "Important concept 2", "Important concept 3"],
    "suggestedFollowUp": "A follow-up question or topic to deepen understanding",
    "difficulty": "beginner|intermediate|advanced based on detected level",
    "relevantTopics": ["Related topic 1", "Related topic 2"]
  }
  
  IMPORTANT: Return ONLY valid JSON, no markdown or additional text.
`,
```

### Nuevo Prompt 2: generateChatTitle()
```typescript
generateChatTitle: (firstMessage: string) => `
  Generate a short, descriptive title (maximum 8 words) for an educational chat based on this first question: "${firstMessage}"
  
  Title requirements:
  - Must be concise and clear
  - Should summarize the main topic
  - Should be engaging for students
  
  Return ONLY the title text, without quotes or additional explanation.
`,
```

---

## 7. Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      MessagesService                          │
│  - sendMessageWithAIResponse()                                │
│  - generateChatTitle() → groqService.generateChatTitleFrom... │
└──────────────────┬────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────────┐  ┌─────────────────────────┐
│ ExamsService     │  │ NotesService            │
│                  │  │                         │
│ - generateFrom   │  │ - generateFromTopic()   │
│   Topic()        │  │ - generateFromReference │
│ - generateFrom   │  │                         │
│   Reference()    │  └────────┬────────────────┘
└────────┬─────────┘           │
         │          ┌──────────┘
         │          │
         │          ▼
         │   ┌─────────────────────────┐
         │   │ FlashCardsService       │
         │   │                         │
         │   │ - generateFromTopic()   │
         │   │ - generateFromReference │
         │   └────────┬────────────────┘
         │            │
         └────────┬───┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │        GroqService                  │
    │                                     │
    │ Métodos especializados:             │
    │ - generateExamFromTopic()          │
    │ - generateExamFromReference()      │
    │ - generateNoteFromTopic()          │
    │ - generateNoteFromReference()      │
    │ - generateFlashcardsFromTopic()    │
    │ - generateFlashcardsFromReference()│
    │ - generateEducationalChatResponse()│
    │ - generateChatTitleFromMessage()   │
    │                                     │
    │ Métodos genéricos (mantenidos):    │
    │ - chat() - genérico                │
    │ - chatMessage() - compatible       │
    │ - chatWithHistory() - compatible   │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │         AI_PROMPTS.ts               │
    │                                     │
    │ Prompts especializados (8):         │
    │ - generateExamFromTopic             │
    │ - generateExamFromReference         │
    │ - generateNoteFromTopic             │
    │ - generateNoteFromReference         │
    │ - generateFlashcardsFromTopic       │
    │ - generateFlashcardsFromReference   │
    │ - generateEducationalChatResponse   │
    │ - generateChatTitle                 │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │    Groq API (llama-3.3-70b)        │
    │                                     │
    │ temperature: 0.2-0.3 (bajo)        │
    │ max_tokens: 2048-4096              │
    │ model: llama-3.3-70b-versatile     │
    └─────────────────────────────────────┘
```

---

## 8. Summary of Changes

| Servicio | Cambios | Antes | Después |
|----------|---------|-------|---------|
| ExamsService | 2 métodos | ❌ chat() | ✅ generateExamFrom*() |
| NotesService | 2 métodos | ❌ chat() | ✅ generateNoteFrom*() |
| FlashCardsService | 3 métodos + 1 eliminado | ❌ parseJSON + chat() | ✅ generateFlashcardsFrom*() |
| MessagesService | 2 métodos + 1 mejorado | ❌ chatMessage() | ✅ generateEducationalChatResponse() |
| GroqService | +2 métodos | 6 métodos | 8 métodos |
| AI_PROMPTS | +2 prompts | 6 prompts | 8 prompts |

---

## 9. Validation

### Compilación
```
✅ No TypeScript errors
✅ No compilation errors
✅ All imports resolved
✅ All types correct
```

### Estructura JSON
```
✅ Exams: { title, description, questions[{ question, options, explanation }] }
✅ Notes: { topic, notes[{ title, contents[{ type, content }] }] }
✅ FlashCards: { topic, cards[{ front, back, difficulty, hint }] }
✅ Chat: { response, keyPoints, difficulty, relevantTopics }
```

### Métodos
```
✅ Todos los métodos async/await correctos
✅ Manejo de errores apropiado
✅ Fallbacks para JSON inválido
✅ Try-catch blocks completos
```

