// filepath: /home/juniorxf/proyectos/klerk/ENDPOINTS_RESUMEN_RAPIDO.md

# ⚡ Resumen Rápido de Endpoints

## 🎯 ¿Qué es Flash Cards?

Es un sistema de **tarjetas de estudio** que usa el método de **Repetición Espaciada** para aprender.

### Analogía
```
📚 MAZO (Card) ← Contenedor
  ├─ 🎴 Tarjeta 1: "¿Cuál es la capital de Francia?" → "París"
  ├─ 🎴 Tarjeta 2: "¿Cuál es la capital de Italia?" → "Roma"
  └─ 🎴 Tarjeta 3: "¿Cuál es la capital de España?" → "Madrid"
```

---

## 📋 Tabla Rápida

### 🏠 Mazos (Cards)

| Endpoint | Acción | Ejemplo |
|----------|--------|---------|
| `PATCH /cards/:id/archive` | Guardar mazo | Archiva "Inglés 101" |
| `PATCH /cards/:id/restore` | Reactivar mazo | Desarchiva "Inglés 101" |
| `GET /cards/:id/stats` | Ver progreso | "Dominas 50/100 tarjetas" |
| `GET /cards/archived/all` | Ver archivados | Lista de mazos guardados |

### 🎴 Tarjetas (Flashcards)

| Endpoint | Acción | Ejemplo |
|----------|--------|---------|
| `POST /flashcards` | Crear tarjeta | Agrega pregunta/respuesta |
| `GET /cards/:id/flashcards` | Obtener todas | Ve 100 tarjetas del mazo |
| `GET /flashcards/:id` | Ver una tarjeta | Detalles de una pregunta |
| `PATCH /flashcards/:id` | Editar | Corrige la respuesta |
| `DELETE /flashcards/:id` | Eliminar | Borra la tarjeta |
| `PATCH /flashcards/:id/archive` | Guardar tarjeta | Marca como "ya domino" |
| `PATCH /flashcards/:id/review` | Marcar revisada | Registra que estudiaste |

---

## 🎓 Flujo de Uso

```
┌─────────────────────────────────────┐
│ Usuario quiere aprender algo nuevo  │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Crea un MAZO (Card)                 │
│ Título: "Inglés 101"                │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Agrega TARJETAS (Flashcards)        │
│ 50 preguntas y respuestas           │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Obtiene tarjetas para ESTUDIAR      │
│ GET /cards/:id/flashcards           │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Usuario ESTUDIA cada tarjeta        │
│ Lee pregunta → piensa → ve respuesta│
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Marca como REVISADA                 │
│ PATCH /flashcards/:id/review        │
│ (Sistema programa próxima revisión) │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Repite hasta dominar todo           │
│ GET /cards/:id/stats → "100% done"  │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ ARCHIVA el mazo                     │
│ PATCH /cards/:id/archive            │
│ (Lo guarda pero no molesta)         │
└─────────────────────────────────────┘
```

---

## 🔑 Conceptos Clave

### ✅ Archive vs Delete
```
DELETE ❌           ARCHIVE ✅
└─ Desaparece      └─ Se guarda
└─ No recuperable  └─ Recuperable luego
└─ Datos perdidos  └─ Datos seguros
```

### ✅ Review (Repetición Espaciada)
```
Cuando estudias una tarjeta:
  Acertaste → Sistema espera 1 día
  Fallaste → Sistema espera 6 horas
  
Próxima revisión calculada automáticamente
```

### ✅ Stats (Estadísticas)
```
{
  "totalCards": 50,        ← Total de tarjetas
  "reviewedCards": 35,     ← Que ya estudiaste
  "masteredCards": 20,     ← Que dominas
  "learningCards": 10,     ← En progreso
  "newCards": 20           ← Sin estudiar
}
```

---

## 💡 Casos de Uso

### 📚 Usuario A: Estudiar para examen
```
1. Crea mazo: "Biología - Examen"
2. Agrega 200 preguntas
3. Estudia diariamente
4. Revisa su progreso: GET /stats
5. Archiva cuando termina
```

### 🎯 Usuario B: Limpiar errores
```
1. Ve que tarjeta 42 tiene error
2. GET /flashcards/42
3. PATCH /flashcards/42 (corrige)
4. O DELETE /flashcards/42 (elimina)
```

### 🔄 Usuario C: Recuperar mazo
```
1. Ve: GET /cards/archived/all
2. Encuentra mazo que quiere
3. PATCH /cards/5/restore
4. Vuelve a estudiar
```

---

## 📊 Resumen de Funciones

| Función | Endpoint | Usa |
|---------|----------|-----|
| **Guardar** | `/archive` | Para "ya terminé esto" |
| **Recuperar** | `/restore` | Para "necesito esto de nuevo" |
| **Ver progreso** | `/stats` | Para saber cuánto dominas |
| **Crear** | `POST` | Para agregar preguntas |
| **Leer** | `GET` | Para ver datos |
| **Editar** | `PATCH` | Para corregir datos |
| **Eliminar** | `DELETE` | Para borrar de verdad |
| **Revisar** | `/review` | Para registrar que estudiaste |

---

## 🚀 Ejemplo Real Completo

### Estudiante aprende vocabulario en inglés

```bash
# 1. Crear mazo
curl -X POST http://localhost:3000/flash-cards/cards \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"English Vocabulary","description":"100 words"}'
  # Respuesta: { "id": 5, "title": "English Vocabulary" }

# 2. Agregar una tarjeta
curl -X POST http://localhost:3000/flash-cards/flashcards \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "question":"What does hello mean?",
    "answer":"A greeting",
    "cardId":5,
    "difficulty":"easy",
    "tags":["greetings"]
  }'
  # Respuesta: { "id": 101, "question": "What does hello mean?" }

# 3. Ver todas las tarjetas
curl http://localhost:3000/flash-cards/cards/5/flashcards \
  -H "Authorization: Bearer TOKEN"
  # Respuesta: [ { "id": 101, "question": "..." }, ... ]

# 4. Estudiar (después de acertar)
curl -X PATCH http://localhost:3000/flash-cards/flashcards/101/review \
  -H "Authorization: Bearer TOKEN"
  # Respuesta: { "id": 101, "reviewDate": "2024-11-28", ... }

# 5. Ver progreso
curl http://localhost:3000/flash-cards/cards/5/stats \
  -H "Authorization: Bearer TOKEN"
  # Respuesta: { "totalCards": 100, "reviewedCards": 75, ... }

# 6. Guardar mazo
curl -X PATCH http://localhost:3000/flash-cards/cards/5/archive \
  -H "Authorization: Bearer TOKEN"
  # Respuesta: { "id": 5, "isArchived": true }
```

---

## ✨ Características Principales

✅ **Repetición Espaciada**
- Sistema inteligente de repaso
- Próximas revisiones calculadas automáticamente

✅ **Archivado Seguro**
- Guardar sin eliminar
- Recuperable en cualquier momento

✅ **Estadísticas**
- Ver progreso real
- Saber qué dominas y qué no

✅ **Flexibilidad**
- Crear, editar, eliminar tarjetas
- Ajustar dificultad

✅ **Organización**
- Tags para categorizar
- Múltiples mazos

---

## 📚 Para Saber Más

Lee: `/klerk/ENDPOINTS_DOCUMENTACION.md`

---

**¡Eso es todo! Ahora entiendes qué hacen esos endpoints "extraños" 😄**

Son la base del sistema de estudio más efectivo: **Repetición Espaciada** ✨