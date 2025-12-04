/**
 * ========================================
 * MEJORAS DE IA INTEGRADAS EN EL PROYECTO
 * ========================================
 * 
 * Este proyecto ha sido mejorado con integraciones de IA en múltiples módulos
 * permitiendo que los usuarios creen contenido de estudio con mínima información.
 * 
 * MÓDULOS MEJORADOS CON IA:
 * 
 * 1. EXAMS (Exámenes)
 *    - Génera exámenes con preguntas de opción múltiple automáticamente
 *    - Input mínimo: tema, número de preguntas, dificultad
 *    - Alternative input: texto de referencia + número de preguntas + dificultad
 *    
 *    Endpoints:
 *    POST /exams/generate/topic
 *    {
 *      "topic": "Historia",
 *      "numberOfQuestions": 10,
 *      "difficulty": "medium"
 *    }
 *    
 *    POST /exams/generate/reference
 *    {
 *      "referenceText": "...",
 *      "numberOfQuestions": 5,
 *      "difficulty": "hard"
 *    }
 * 
 * 2. FLASHCARDS (Tarjetas de aprendizaje)
 *    - Genera flashcards automáticamente desde un tema o texto
 *    - Incluye dificultad variada y hints para cada tarjeta
 *    - Input mínimo: tema, número de tarjetas, cardId
 *    
 *    Endpoints:
 *    POST /flash-cards/generate/topic
 *    {
 *      "topic": "Vocabulario English",
 *      "numberOfCards": 20,
 *      "cardId": 1
 *    }
 *    
 *    POST /flash-cards/generate/reference
 *    {
 *      "referenceText": "...",
 *      "numberOfCards": 15,
 *      "cardId": 1
 *    }
 * 
 * 3. NOTES (Notas de estudio)
 *    - Genera notas completas y organizadas desde un tema
 *    - Alternative: genera notas desde un texto de referencia
 *    - Input mínimo: tema o texto de referencia
 *    
 *    Endpoints:
 *    POST /notes/generate/topic
 *    {
 *      "topic": "Fotosíntesis"
 *    }
 *    
 *    POST /notes/generate/reference
 *    {
 *      "referenceText": "..."
 *    }
 * 
 * 4. MESSAGES (Mensajes con IA)
 *    - Responde preguntas del usuario usando IA
 *    - Crea o reutiliza chats existentes
 *    - Input mínimo: prompt, chatId opcional
 *    
 *    Endpoints:
 *    POST /messages/send
 *    {
 *      "prompt": "¿Cómo funciona el ciclo del agua?",
 *      "chatId": 1 (opcional)
 *    }
 *    
 *    POST /messages/chat/create
 *    {
 *      "title": "Mi chat de estudio"
 *    }
 * 
 * FORMATO DE RESPUESTAS:
 * 
 * Todas las respuestas generadas por IA vienen en formato JSON estructurado:
 * 
 * - EXAMS: { title, description, totalQuestions, questions[] }
 * - FLASHCARDS: { success, totalCreated, cards[] }
 * - NOTES: { title, content, tags[] }
 * - MESSAGES: { chat, messages[], aiResponse }
 * 
 * MANEJO DE ERRORES:
 * 
 * - BadRequestException: Parámetros inválidos o faltantes
 * - NotFoundException: Recurso no encontrado
 * - InternalServerErrorException: Error durante generación con IA
 * 
 * Todos los errores incluyen mensajes descriptivos para debugging.
 * 
 * VALIDACIONES:
 * 
 * - Los temas no pueden estar vacíos
 * - numberOfQuestions/numberOfCards deben ser mayores a 0
 * - La dificultad debe ser: easy, medium o hard
 * - Todo usuario debe estar autenticado (JwtGuard)
 * 
 * CARACTERÍSTICAS DE IA:
 * 
 * - Prompts estructurados en AI_PROMPTS.ts para consistencia
 * - Validación de respuestas antes de guardar en BD
 * - Manejo robusto de excepciones desde IA
 * - Respuestas JSON puras sin markdown
 */