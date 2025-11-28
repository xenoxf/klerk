// filepath: /home/juniorxf/proyectos/klerk/ENDPOINTS_DOCUMENTACION.md

# 📚 Documentación de Endpoints - Flash Cards

## 🎯 Resumen General

Estos endpoints son para el sistema de **Tarjetas Flash (Flashcards)** - una herramienta de estudio basada en repetición espaciada. Permiten crear, organizar, estudiar y dar seguimiento a tarjetas de aprendizaje.

---

## 📦 Estructura de Datos

### Card (Mazo de Tarjetas)
```typescript
{
  id: number;
  title: string;              // "Vocabulario Inglés"
  description?: string;       // "200 palabras comunes"
  totalCards: number;         // 50 tarjetas
  reviewedCards: number;      // 15 revisadas
  lastReviewDate?: Date;      // Última vez que estudió
  isArchived: boolean;        // Está guardada/inactiva
  createdAt: Date;
  updatedAt: Date;
  flashcards: FlashCard[];    // Array de tarjetas
}
```

### FlashCard (Tarjeta Individual)
```typescript
{
  id: number;
  question: string;           // "¿Cómo se dice hola en inglés?"
  answer: string;             // "Hello"
  hint?: string;              // Pista opcional
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];             // ["vocabulario", "inglés"]
  createdAt: Date;
  updatedAt: Date;
  reviewDate?: Date;          // Próxima vez a revisar
  isArchived: boolean;
  numCard: number;            // Número de orden
  cardId: number;             // Referencia al mazo
}
```

---

## 🔍 Endpoints Explicados

### 1. 📁 GESTIÓN DE MAZOS (Cards)

#### `PATCH /flash-cards/cards/:id/archive`
**¿Para qué?** Archivar un mazo completo

**Ejemplo:**
```bash
PATCH /flash-cards/cards/5/archive
```

**Respuesta:**
```json
{
  "id": 5,
  "title": "Vocabulario Inglés",
  "isArchived": true,
  "message": "Card archived"
}
```

**Caso de uso:**
- Usuario estudió un tema y quiere guardarlo sin que aparezca en listados
- Ya no quiere estudiar este mazo ahora pero podría volver después
- Mantiene su espacio organizado

---

#### `PATCH /flash-cards/cards/:id/restore`
**¿Para qué?** Desarchivar un mazo

**Ejemplo:**
```bash
PATCH /flash-cards/cards/5/restore
```

**Respuesta:**
```json
{
  "id": 5,
  "title": "Vocabulario Inglés",
  "isArchived": false,
  "message": "Card restored"
}
```

**Caso de uso:**
- Usuario quiere volver a estudiar un mazo archivado
- Reactiva un mazo para seguir estudiando

---

#### `GET /flash-cards/cards/:id/stats`
**¿Para qué?** Obtener estadísticas de un mazo

**Ejemplo:**
```bash
GET /flash-cards/cards/5/stats
```

**Respuesta:**
```json
{
  "cardId": 5,
  "totalCards": 50,
  "reviewedCards": 15,
  "reviewPercentage": 30,
  "avgDifficulty": "medium",
  "lastReviewDate": "2024-11-27T12:00:00Z",
  "nextReviewDate": "2024-11-28T12:00:00Z",
  "masteredCards": 8,
  "learningCards": 5,
  "newCards": 37
}
```

**Caso de uso:**
- Ver progreso de estudio
- Saber cuántas tarjetas ya domina
- Entender su velocidad de aprendizaje

---

#### `GET /flash-cards/cards/archived/all`
**¿Para qué?** Obtener TODOS los mazos archivados

**Ejemplo:**
```bash
GET /flash-cards/cards/archived/all
```

**Respuesta:**
```json
[
  {
    "id": 5,
    "title": "Vocabulario Inglés",
    "totalCards": 50,
    "isArchived": true,
    "createdAt": "2024-10-01T00:00:00Z"
  },
  {
    "id": 7,
    "title": "Biología",
    "totalCards": 80,
    "isArchived": true,
    "createdAt": "2024-09-15T00:00:00Z"
  }
]
```

**Caso de uso:**
- Ver todos los mazos que usuario archivó
- Buscar un mazo antiguo
- Recuperar algo que archivó

---

### 2. 🎴 GESTIÓN DE TARJETAS INDIVIDUALES (Flashcards)

#### `POST /flash-cards/flashcards`
**¿Para qué?** Crear una nueva tarjeta individual

**Ejemplo:**
```bash
POST /flash-cards/flashcards
Content-Type: application/json

{
  "question": "¿Capital de Francia?",
  "answer": "París",
  "cardId": 5,
  "difficulty": "easy",
  "hint": "La ciudad del amor",
  "tags": ["geografía", "capitales"]
}
```

**Respuesta:**
```json
{
  "id": 123,
  "question": "¿Capital de Francia?",
  "answer": "París",
  "cardId": 5,
  "difficulty": "easy",
  "hint": "La ciudad del amor",
  "tags": ["geografía", "capitales"],
  "createdAt": "2024-11-27T01:30:00Z",
  "isArchived": false,
  "numCard": 1
}
```

**Caso de uso:**
- Agregar una pregunta al mazo
- Crear tarjeta de estudio manual
- Expandir un mazo existente

---

#### `GET /flash-cards/cards/:cardId/flashcards`
**¿Para qué?** Obtener TODAS las tarjetas de un mazo

**Ejemplo:**
```bash
GET /flash-cards/cards/5/flashcards
```

**Respuesta:**
```json
[
  {
    "id": 123,
    "question": "¿Capital de Francia?",
    "answer": "París",
    "difficulty": "easy",
    "tags": ["geografía"],
    "reviewDate": "2024-11-28T00:00:00Z"
  },
  {
    "id": 124,
    "question": "¿Capital de Italia?",
    "answer": "Roma",
    "difficulty": "medium",
    "tags": ["geografía"],
    "reviewDate": "2024-11-29T00:00:00Z"
  }
]
```

**Caso de uso:**
- Ver todas las tarjetas de un mazo
- Estudiar/repasar el contenido
- Editar o eliminar tarjetas

---

#### `GET /flash-cards/flashcards/:id`
**¿Para qué?** Obtener una tarjeta ESPECÍFICA

**Ejemplo:**
```bash
GET /flash-cards/flashcards/123
```

**Respuesta:**
```json
{
  "id": 123,
  "question": "¿Capital de Francia?",
  "answer": "París",
  "hint": "La ciudad del amor",
  "difficulty": "easy",
  "tags": ["geografía"],
  "reviewDate": "2024-11-28T00:00:00Z",
  "isArchived": false
}
```

**Caso de uso:**
- Ver detalles de una tarjeta
- Verificar la respuesta correcta
- Editar una tarjeta específica

---

#### `PATCH /flash-cards/flashcards/:id`
**¿Para qué?** Actualizar una tarjeta (editar pregunta/respuesta)

**Ejemplo:**
```bash
PATCH /flash-cards/flashcards/123
Content-Type: application/json

{
  "question": "¿Cuál es la capital de Francia?",
  "answer": "París - la ciudad del Sena",
  "difficulty": "medium",
  "tags": ["geografía", "europa"]
}
```

**Respuesta:**
```json
{
  "id": 123,
  "question": "¿Cuál es la capital de Francia?",
  "answer": "París - la ciudad del Sena",
  "difficulty": "medium",
  "tags": ["geografía", "europa"],
  "updatedAt": "2024-11-27T02:00:00Z"
}
```

**Caso de uso:**
- Corregir errores en una tarjeta
- Mejorar la pregunta o respuesta
- Cambiar dificultad
- Agregar más información

---

#### `DELETE /flash-cards/flashcards/:id`
**¿Para qué?** Eliminar una tarjeta

**Ejemplo:**
```bash
DELETE /flash-cards/flashcards/123
```

**Respuesta:**
```json
{
  "message": "Flashcard deleted successfully",
  "id": 123
}
```

**Caso de uso:**
- Eliminar una tarjeta con error
- Limpiar el mazo
- Remover contenido duplicado

---

#### `PATCH /flash-cards/flashcards/:id/archive`
**¿Para qué?** Archivar una tarjeta (sin eliminarla)

**Ejemplo:**
```bash
PATCH /flash-cards/flashcards/123/archive
```

**Respuesta:**
```json
{
  "id": 123,
  "question": "¿Capital de Francia?",
  "isArchived": true,
  "message": "Flashcard archived"
}
```

**Caso de uso:**
- Marcar una tarjeta como "ya dominada"
- Ocultarla del estudio sin eliminarla
- Guardar para referencia futura

---

#### `PATCH /flash-cards/flashcards/:id/review`
**¿Para qué?** Marcar tarjeta como revisada (algoritmo de repetición espaciada)

**Ejemplo:**
```bash
PATCH /flash-cards/flashcards/123/review
```

**Respuesta:**
```json
{
  "id": 123,
  "question": "¿Capital de Francia?",
  "reviewDate": "2024-11-30T00:00:00Z",
  "reviewCount": 5,
  "message": "Card marked as reviewed"
}
```

**Caso de uso:**
- Registrar que el usuario acertó
- Actualizar próxima fecha de revisión
- Mantener estadísticas de aprendizaje
- Algoritmo de Spaced Repetition

---

## 🎓 Flujo Típico de Estudio

```
1. Usuario crea un mazo
   POST /flash-cards/cards
   
2. Agrega tarjetas al mazo
   POST /flash-cards/flashcards (múltiples)
   
3. Obtiene tarjetas para estudiar
   GET /flash-cards/cards/5/flashcards
   
4. Estudia cada tarjeta y marca como revisada
   PATCH /flash-cards/flashcards/123/review
   
5. Consulta su progreso
   GET /flash-cards/cards/5/stats
   
6. Cuando termina un mazo, lo archiva
   PATCH /flash-cards/cards/5/archive
   
7. Recupera mazos archivados si lo necesita
   GET /flash-cards/cards/archived/all
   PATCH /flash-cards/cards/5/restore
```

---

## 📊 Comparación de Endpoints

| Endpoint | Método | Para | Resultado |
|----------|--------|------|-----------|
| `/cards/:id/archive` | PATCH | Archivar mazo | Mazo oculto |
| `/cards/:id/restore` | PATCH | Desarchivar mazo | Mazo visible |
| `/cards/:id/stats` | GET | Ver progreso | Estadísticas |
| `/cards/archived/all` | GET | Ver archivados | Lista de mazos |
| `/flashcards` | POST | Crear tarjeta | Tarjeta nueva |
| `/cards/:id/flashcards` | GET | Ver todas | Lista de tarjetas |
| `/flashcards/:id` | GET | Ver una | Una tarjeta |
| `/flashcards/:id` | PATCH | Editar | Tarjeta actualizada |
| `/flashcards/:id` | DELETE | Eliminar | Tarjeta removida |
| `/flashcards/:id/archive` | PATCH | Archivar tarjeta | Tarjeta oculta |
| `/flashcards/:id/review` | PATCH | Marcar revisada | Fecha actualizada |

---

## 🛠️ Casos de Uso Prácticos

### Caso 1: Estudiante aprende vocabulario
```bash
# 1. Crear mazo
POST /flash-cards/cards
→ { id: 5, title: "Inglés 101" }

# 2. Agregar 10 tarjetas
POST /flash-cards/flashcards (x10)
→ Cada tarjeta tiene palabra + definición

# 3. Estudiar
GET /flash-cards/cards/5/flashcards
→ Obtiene las 10 palabras

# 4. Marcar como estudiadas
PATCH /flash-cards/flashcards/123/review
PATCH /flash-cards/flashcards/124/review
...

# 5. Ver progreso
GET /flash-cards/cards/5/stats
→ "Has revisado 10 de 10 - 100%"

# 6. Guardar mazo
PATCH /flash-cards/cards/5/archive
```

### Caso 2: Eliminar una tarjeta con error
```bash
# Ver la tarjeta
GET /flash-cards/flashcards/123

# Eliminarla
DELETE /flash-cards/flashcards/123

# O solo archivarla (más seguro)
PATCH /flash-cards/flashcards/123/archive
```

### Caso 3: Recuperar mazo antiguo
```bash
# Ver todos los archivados
GET /flash-cards/cards/archived/all

# Desarchivar el que necesito
PATCH /flash-cards/cards/5/restore

# Volver a estudiar
GET /flash-cards/cards/5/flashcards
```

---

## 🔐 Seguridad

Todos estos endpoints requieren:
```
Authorization: Bearer {token}
x-api-key: {api_key}
```

---

## 📝 Resumen

- **Cards (Mazos)**: Contenedores de tarjetas
- **Flashcards (Tarjetas)**: Preguntas y respuestas individuales
- **Archive**: Guardar sin eliminar
- **Review**: Marcar como estudiado (Spaced Repetition)
- **Stats**: Ver progreso

---

**Última actualización:** 2024
**Versión:** 1.0.0